"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { EmptyState } from "./components/EmptyState";
import { HistoryCard } from "./components/HistoryCard";
import { Metric } from "./components/Metric";
import { PendingCard } from "./components/PendingCard";
import { approveMessage, editMessage, fetchMessages, rejectMessage } from "./lib/api";
import {
  convertBrazilianDateToInputDate,
  isHistoryItem,
  isPendingMessage,
  toDashboardMessage,
} from "./lib/messages";
import type { HistoryItem, PendingMessage } from "./types/messages";

type Section = "approval" | "prompt";
type ToastVariant = "success" | "warning";

interface PromptVersion {
  id: number;
  createdAt: string;
  createdDate: string;
  label: string;
  content: string;
  origin: string;
}

interface ToastState {
  id: number;
  message: string;
  variant: ToastVariant;
}

const itemsPerPageOptions = [5, 10, 25];
const promptHistoryPageSizeOptions = [4, 8, 12];
const apiErrorMessage =
  "Nao foi possivel conectar a API. Verifique se o backend esta rodando e tente novamente.";

const initialPrompt = `Crie uma mensagem curta, acolhedora e profissional de aniversário para a pessoa informada.

Use o nome da pessoa de forma natural.
Evite exageros, frases genéricas demais e textos muito longos.
Finalize com um tom positivo e humano.`;

const initialVersions: PromptVersion[] = [
  {
    id: 3,
    createdAt: "18/06/2026 14:32",
    createdDate: "2026-06-18",
    label: "Versão ativa",
    origin: "Salva manualmente",
    content: initialPrompt,
  },
  {
    id: 2,
    createdAt: "17/06/2026 09:18",
    createdDate: "2026-06-17",
    label: "Ajuste de tom",
    origin: "Salva manualmente",
    content: `Crie uma mensagem de aniversário em português brasileiro.

Use linguagem carinhosa, mas sem soar exagerada.
Inclua o nome da pessoa e deseje um novo ciclo leve, feliz e especial.`,
  },
  {
    id: 1,
    createdAt: "15/06/2026 16:05",
    createdDate: "2026-06-15",
    label: "Primeira versão",
    origin: "Configuração inicial",
    content: `Gere uma mensagem de feliz aniversário para o aniversariante.

A mensagem deve ser educada, positiva e adequada para envio em grupo de WhatsApp.`,
  },
];

const previewMessage =
  "Feliz aniversário, teste! Que seu novo ciclo seja leve, feliz e cheio de boas notícias. Todos aqui desejam um dia especial e momentos que façam você sorrir.";

export default function Home() {
  const [section, setSection] = useState<Section>("approval");
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [historyDate, setHistoryDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [apiError, setApiError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [versions, setVersions] = useState(initialVersions);
  const [preview, setPreview] = useState(previewMessage);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [toastProgress, setToastProgress] = useState(100);

  const activeVersion = versions[0];

  const loadMessages = useCallback(async () => {
    try {
      const messages = await fetchMessages();
      const dashboardMessages = messages.map(toDashboardMessage);

      setPendingMessages(dashboardMessages.filter(isPendingMessage));
      setHistory(dashboardMessages.filter(isHistoryItem));
      setApiError(null);
    } catch {
      setApiError(apiErrorMessage);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadMessages();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadMessages]);

  useEffect(() => {
    if (!toast) return;

    const progressTimer = window.setTimeout(() => {
      setToastProgress(0);
    }, 50);

    const dismissTimer = window.setTimeout(() => {
      setToast(null);
    }, 5050);

    return () => {
      window.clearTimeout(progressTimer);
      window.clearTimeout(dismissTimer);
    };
  }, [toast]);

  const stats = useMemo(
    () => ({
      sent: history.filter((item) => item.status === "Enviado").length,
      edited: history.filter((item) => item.status === "Editado e Enviado").length,
      rejected: history.filter((item) => item.status === "Reprovado").length,
    }),
    [history]
  );

  const filteredHistory = useMemo(() => {
    const normalizedSearch = historySearch.trim().toLowerCase();

    return history.filter((item) => {
      const matchesName = item.name.toLowerCase().includes(normalizedSearch);
      const matchesDate = historyDate
        ? convertBrazilianDateToInputDate(item.date) === historyDate
        : true;

      return matchesName && matchesDate;
    });
  }, [history, historyDate, historySearch]);

  const totalHistoryResults = filteredHistory.length;
  const totalHistoryPages = Math.max(1, Math.ceil(totalHistoryResults / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalHistoryPages);
  const paginatedHistory = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * itemsPerPage;
    return filteredHistory.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredHistory, itemsPerPage, safeCurrentPage]);
  const historyStartResult =
    totalHistoryResults === 0 ? 0 : (safeCurrentPage - 1) * itemsPerPage + 1;
  const historyEndResult = Math.min(safeCurrentPage * itemsPerPage, totalHistoryResults);

  function showToast(message: string, variant: ToastVariant) {
    setToastProgress(100);
    setToast({ id: Date.now(), message, variant });
  }

  const handleApprove = async (id: string) => {
    try {
      await approveMessage(id);
      await loadMessages();
    } catch {
      setApiError("Nao foi possivel aprovar a mensagem. Tente novamente.");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectMessage(id);
      await loadMessages();
    } catch {
      setApiError("Nao foi possivel reprovar a mensagem. Tente novamente.");
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId || !draftMessage.trim()) return;

    try {
      await editMessage(editingId, draftMessage);
      setEditingId(null);
      setDraftMessage("");
      await loadMessages();
    } catch {
      setApiError("Nao foi possivel salvar a edicao. Tente novamente.");
    }
  };

  const approveAllPending = async () => {
    if (pendingMessages.length === 0) return;

    try {
      await Promise.all(pendingMessages.map((message) => approveMessage(message.id)));
      await loadMessages();
    } catch {
      setApiError("Nao foi possivel aprovar todas as mensagens. Tente novamente.");
    }
  };

  function saveVersion() {
    if (!prompt.trim() || prompt.trim() === versions[0].content.trim()) {
      showToast("Altere o prompt antes de salvar!", "warning");
      return;
    }

    const newVersion: PromptVersion = {
      id: versions[0].id + 1,
      createdAt: "18/06/2026 15:10",
      createdDate: "2026-06-18",
      label: "Nova versão",
      origin: "Salva manualmente",
      content: prompt,
    };

    setVersions([newVersion, ...versions]);
    setPreview("");
    showToast("Novo prompt salvo com sucesso!", "success");
  }

  function restoreVersion(version: PromptVersion) {
    const restoredVersion: PromptVersion = {
      id: versions[0].id + 1,
      createdAt: "18/06/2026 15:12",
      createdDate: "2026-06-18",
      label: `Restaurada da versão ${version.id}`,
      origin: "Restauração",
      content: version.content,
    };

    setPrompt(version.content);
    setVersions([restoredVersion, ...versions]);
    setPreview("");
    showToast("Prompt restaurado com sucesso!", "success");
  }

  function generatePreview() {
    setPreview(
      "Feliz aniversário, teste! Que este novo ciclo traga alegria, saúde e momentos especiais. Todos aqui torcem para que seu dia seja leve, feliz e cheio de boas lembranças."
    );
  }

  function startEditing(item: PendingMessage) {
    setEditingId(item.id);
    setDraftMessage(item.message);
  }

  function cancelEdit() {
    setEditingId(null);
    setDraftMessage("");
  }

  function updateHistorySearch(value: string) {
    setHistorySearch(value);
    setCurrentPage(1);
  }

  function updateHistoryDate(value: string) {
    setHistoryDate(value);
    setCurrentPage(1);
  }

  function updateItemsPerPage(value: string) {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  }

  function clearHistoryFilters() {
    setHistorySearch("");
    setHistoryDate("");
    setCurrentPage(1);
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="lg:grid lg:min-h-screen lg:grid-cols-[248px_minmax(0,1fr)]">
        <aside className="border-b border-slate-200 bg-white lg:border-b-0 lg:border-r">
          <div className="flex h-full flex-col px-5 py-5">
            <div className="mb-5">
              <p className="text-xl font-semibold text-slate-950">Birthday.ai</p>
              <p className="mt-1 text-sm text-slate-500">Painel administrativo</p>
            </div>

            <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
              <button
                type="button"
                onClick={() => setSection("approval")}
                className={`min-h-11 rounded-md px-3 text-left text-sm font-semibold transition ${
                  section === "approval"
                    ? "bg-slate-950 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                Aprovação
              </button>
              <button
                type="button"
                onClick={() => setSection("prompt")}
                className={`min-h-11 rounded-md px-3 text-left text-sm font-semibold transition ${
                  section === "prompt"
                    ? "bg-slate-950 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                Prompt
              </button>
              <button
                type="button"
                disabled
                className="min-h-11 cursor-not-allowed rounded-md px-3 text-left text-sm font-semibold text-slate-300"
              >
                Aniversariantes
              </button>
            </nav>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-6 xl:flex-row xl:items-center xl:justify-between">
              <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
                {section === "approval" ? "Painel de Aprovação" : "Configuração do Prompt"}
              </h1>

              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <Metric label="Pendentes" value={pendingMessages.length} />
                <Metric label="Enviadas" value={stats.sent} />
                <Metric label="Editadas" value={stats.edited} />
                <Metric label="Reprovadas" value={stats.rejected} />
              </div>
            </div>
          </header>

          {section === "approval" ? (
            <ApprovalPanel
              apiError={apiError}
              pendingMessages={pendingMessages}
              history={paginatedHistory}
              editingId={editingId}
              draftMessage={draftMessage}
              historySearch={historySearch}
              historyDate={historyDate}
              itemsPerPage={itemsPerPage}
              safeCurrentPage={safeCurrentPage}
              totalHistoryPages={totalHistoryPages}
              totalHistoryResults={totalHistoryResults}
              historyStartResult={historyStartResult}
              historyEndResult={historyEndResult}
              onApproveAll={approveAllPending}
              onApprove={handleApprove}
              onReject={handleReject}
              onStartEditing={startEditing}
              onDraftChange={setDraftMessage}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={cancelEdit}
              onHistorySearchChange={updateHistorySearch}
              onHistoryDateChange={updateHistoryDate}
              onItemsPerPageChange={updateItemsPerPage}
              onClearHistoryFilters={clearHistoryFilters}
              onPageChange={setCurrentPage}
            />
          ) : null}

          {section === "prompt" ? (
            <PromptPanel
              activeVersion={activeVersion}
              prompt={prompt}
              preview={preview}
              versions={versions}
              onPromptChange={setPrompt}
              onSaveVersion={saveVersion}
              onRestoreVersion={restoreVersion}
              onGeneratePreview={generatePreview}
            />
          ) : null}
        </section>
      </div>

      {toast ? (
        <Toast
          key={toast.id}
          message={toast.message}
          progress={toastProgress}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      ) : null}
    </main>
  );
}

interface ApprovalPanelProps {
  apiError: string | null;
  pendingMessages: PendingMessage[];
  history: HistoryItem[];
  editingId: string | null;
  draftMessage: string;
  historySearch: string;
  historyDate: string;
  itemsPerPage: number;
  safeCurrentPage: number;
  totalHistoryPages: number;
  totalHistoryResults: number;
  historyStartResult: number;
  historyEndResult: number;
  onApproveAll: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onStartEditing: (item: PendingMessage) => void;
  onDraftChange: (message: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onHistorySearchChange: (value: string) => void;
  onHistoryDateChange: (value: string) => void;
  onItemsPerPageChange: (value: string) => void;
  onClearHistoryFilters: () => void;
  onPageChange: (value: number | ((page: number) => number)) => void;
}

function ApprovalPanel({
  apiError,
  pendingMessages,
  history,
  editingId,
  draftMessage,
  historySearch,
  historyDate,
  itemsPerPage,
  safeCurrentPage,
  totalHistoryPages,
  totalHistoryResults,
  historyStartResult,
  historyEndResult,
  onApproveAll,
  onApprove,
  onReject,
  onStartEditing,
  onDraftChange,
  onSaveEdit,
  onCancelEdit,
  onHistorySearchChange,
  onHistoryDateChange,
  onItemsPerPageChange,
  onClearHistoryFilters,
  onPageChange,
}: ApprovalPanelProps) {
  return (
    <>
      {apiError ? (
        <div className="mx-auto mt-6 max-w-7xl px-6">
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
          >
            {apiError}
          </div>
        </div>
      ) : null}

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(380px,0.85fr)]">
        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Fila de Aprovação</h2>
              <p className="mt-1 text-sm text-slate-500">
                Revise mensagens geradas antes do envio pelo WhatsApp.
              </p>
            </div>

            <button
              type="button"
              onClick={onApproveAll}
              disabled={pendingMessages.length === 0}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Aprovar Todos os Pendentes
            </button>
          </div>

          <div className="space-y-4 p-5">
            {pendingMessages.length > 0 ? (
              pendingMessages.map((item) => (
                <PendingCard
                  key={item.id}
                  item={item}
                  isEditing={editingId === item.id}
                  draftMessage={draftMessage}
                  onDraftChange={onDraftChange}
                  onApprove={() => onApprove(item.id)}
                  onEdit={() => onStartEditing(item)}
                  onReject={() => onReject(item.id)}
                  onSaveEdit={onSaveEdit}
                  onCancelEdit={onCancelEdit}
                />
              ))
            ) : (
              <EmptyState text="Nenhuma mensagem aguardando aprovação." />
            )}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-xl font-semibold text-slate-950">Histórico de Ações</h2>
            <p className="mt-1 text-sm text-slate-500">Últimas decisões tomadas pela operação.</p>
          </div>

          <div className="border-b border-slate-200 p-5">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_170px_auto]">
              <label className="block">
                <span className="text-xs font-semibold uppercase text-slate-500">
                  Pesquisa por Nome
                </span>
                <input
                  type="text"
                  value={historySearch}
                  onChange={(event) => onHistorySearchChange(event.target.value)}
                  placeholder="Buscar aniversariante"
                  className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase text-slate-500">Data</span>
                <input
                  type="date"
                  value={historyDate}
                  onChange={(event) => onHistoryDateChange(event.target.value)}
                  className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                />
              </label>

              <button
                type="button"
                onClick={onClearHistoryFilters}
                className="inline-flex h-11 items-center justify-center self-end rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Limpar filtros
              </button>
            </div>
          </div>

          <div className="space-y-4 p-5">
            {history.length > 0 ? (
              history.map((item) => <HistoryCard key={item.id} item={item} />)
            ) : (
              <EmptyState text="Nenhum resultado encontrado para os filtros." />
            )}
          </div>

          <div className="flex flex-col gap-4 border-t border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm font-medium text-slate-600">
              Mostrando {historyStartResult} a {historyEndResult} de {totalHistoryResults} resultados
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
                Itens por página
                <select
                  value={itemsPerPage}
                  onChange={(event) => onItemsPerPageChange(event.target.value)}
                  className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                >
                  {itemsPerPageOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onPageChange((page) => Math.max(1, page - 1))}
                  disabled={safeCurrentPage === 1}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300 disabled:hover:bg-white"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => onPageChange((page) => Math.min(totalHistoryPages, page + 1))}
                  disabled={safeCurrentPage >= totalHistoryPages}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300 disabled:hover:bg-white"
                >
                  Próximo
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

interface PromptPanelProps {
  activeVersion: PromptVersion;
  prompt: string;
  preview: string;
  versions: PromptVersion[];
  onPromptChange: (value: string) => void;
  onSaveVersion: () => void;
  onRestoreVersion: (version: PromptVersion) => void;
  onGeneratePreview: () => void;
}

function PromptPanel({
  activeVersion,
  prompt,
  preview,
  versions,
  onPromptChange,
  onSaveVersion,
  onRestoreVersion,
  onGeneratePreview,
}: PromptPanelProps) {
  const [historySearch, setHistorySearch] = useState("");
  const [historyDate, setHistoryDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(4);
  const hasPromptChanges = prompt.trim().length > 0 && prompt.trim() !== activeVersion.content.trim();

  const filteredVersions = useMemo(() => {
    const normalizedSearch = historySearch.trim().toLowerCase();

    return versions.filter((version) => {
      const matchesMessage = version.content.toLowerCase().includes(normalizedSearch);
      const matchesDate = historyDate ? version.createdDate === historyDate : true;

      return matchesMessage && matchesDate;
    });
  }, [historyDate, historySearch, versions]);

  const totalHistoryResults = filteredVersions.length;
  const totalHistoryPages = Math.max(1, Math.ceil(totalHistoryResults / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalHistoryPages);
  const historyStartResult =
    totalHistoryResults === 0 ? 0 : (safeCurrentPage - 1) * itemsPerPage + 1;
  const historyEndResult = Math.min(safeCurrentPage * itemsPerPage, totalHistoryResults);

  const paginatedVersions = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * itemsPerPage;
    return filteredVersions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredVersions, itemsPerPage, safeCurrentPage]);

  function updateHistorySearch(value: string) {
    setHistorySearch(value);
    setCurrentPage(1);
  }

  function updateHistoryDate(value: string) {
    setHistoryDate(value);
    setCurrentPage(1);
  }

  function updateItemsPerPage(value: string) {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  }

  function clearHistoryFilters() {
    setHistorySearch("");
    setHistoryDate("");
    setCurrentPage(1);
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 xl:grid-cols-[minmax(0,1fr)_420px]">
      <section className="space-y-6">
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Prompt Atual</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Ativo desde {activeVersion.createdAt}
                </p>
              </div>
              <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                {activeVersion.label}
              </span>
            </div>
          </div>

          <div className="p-5">
            <textarea
              value={prompt}
              onChange={(event) => onPromptChange(event.target.value)}
              className="min-h-72 w-full resize-y rounded-md border border-slate-300 bg-white p-4 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            />

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onGeneratePreview}
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Gerar prévia
              </button>
              <button
                type="button"
                onClick={onSaveVersion}
                aria-disabled={!hasPromptChanges}
                className={`inline-flex min-h-11 items-center justify-center rounded-md px-5 text-sm font-semibold text-white transition ${
                  hasPromptChanges
                    ? "bg-slate-950 hover:bg-slate-800"
                    : "bg-slate-500 hover:bg-slate-600"
                }`}
              >
                Salvar nova versão
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-xl font-semibold text-slate-950">Histórico de Versões</h2>
            <p className="mt-1 text-sm text-slate-500">
              Cada restauração cria uma nova versão ativa.
            </p>
          </div>

          <div className="border-b border-slate-200 p-5">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_170px_auto]">
              <label className="block">
                <span className="text-xs font-semibold uppercase text-slate-500">
                  Buscar por mensagem
                </span>
                <input
                  type="text"
                  value={historySearch}
                  onChange={(event) => updateHistorySearch(event.target.value)}
                  placeholder="Buscar texto do prompt"
                  className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase text-slate-500">Data</span>
                <input
                  type="date"
                  value={historyDate}
                  onChange={(event) => updateHistoryDate(event.target.value)}
                  className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                />
              </label>

              <button
                type="button"
                onClick={clearHistoryFilters}
                className="inline-flex h-11 items-center justify-center self-end rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Limpar filtros
              </button>
            </div>
          </div>

          <div className="grid gap-4 p-5 lg:grid-cols-2">
            {paginatedVersions.length > 0 ? (
              paginatedVersions.map((version) => (
                <article
                  key={version.id}
                  className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{version.createdAt}</p>
                      <p className="mt-1 text-xs font-medium uppercase text-slate-500">
                        {version.origin}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      v{version.id}
                    </span>
                  </div>

                  <p className="mt-4 line-clamp-4 whitespace-pre-line text-sm leading-6 text-slate-600">
                    {version.content}
                  </p>

                  <button
                    type="button"
                    onClick={() => onRestoreVersion(version)}
                    className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Restaurar esta versão
                  </button>
                </article>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-medium text-slate-500 lg:col-span-2">
                Nenhuma versão encontrada para os filtros.
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 border-t border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm font-medium text-slate-600">
              Mostrando {historyStartResult} a {historyEndResult} de {totalHistoryResults} versões
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
                Itens por página
                <select
                  value={itemsPerPage}
                  onChange={(event) => updateItemsPerPage(event.target.value)}
                  className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                >
                  {promptHistoryPageSizeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={safeCurrentPage === 1}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300 disabled:hover:bg-white"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(totalHistoryPages, page + 1))}
                  disabled={safeCurrentPage >= totalHistoryPages}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300 disabled:hover:bg-white"
                >
                  Próximo
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <aside className="space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-xl font-semibold text-slate-950">Prévia</h2>
          </div>

          <div className="p-5">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Mensagem gerada</p>
              {preview ? (
                <p className="mt-2 text-sm leading-6 text-slate-700">{preview}</p>
              ) : (
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Gere uma nova prévia para visualizar a mensagem com o prompt atual.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-base font-semibold text-slate-950">Resumo</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">Versão ativa</dt>
              <dd className="font-semibold text-slate-950">v{activeVersion.id}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">Versões salvas</dt>
              <dd className="font-semibold text-slate-950">{versions.length}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">Último evento</dt>
              <dd className="font-semibold text-slate-950">{activeVersion.origin}</dd>
            </div>
          </dl>
        </section>
      </aside>
    </div>
  );
}

interface ToastProps {
  message: string;
  progress: number;
  variant: ToastVariant;
  onClose: () => void;
}

function Toast({ message, progress, variant, onClose }: ToastProps) {
  const isWarning = variant === "warning";
  const styles = isWarning
    ? {
        border: "border-amber-200",
        iconBg: "bg-amber-100",
        iconText: "text-amber-700",
        text: "text-amber-900",
        hover: "hover:bg-amber-50",
        track: "bg-amber-50",
        bar: "bg-amber-500",
        icon: "!",
      }
    : {
        border: "border-emerald-200",
        iconBg: "bg-emerald-100",
        iconText: "text-emerald-700",
        text: "text-emerald-800",
        hover: "hover:bg-emerald-50",
        track: "bg-emerald-50",
        bar: "bg-emerald-500",
        icon: "✓",
      };

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 w-[min(360px,calc(100vw-40px))] overflow-hidden rounded-lg border bg-white shadow-lg ${styles.border}`}
    >
      <div className="flex items-start gap-3 p-4">
        <div
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold ${styles.iconBg} ${styles.iconText}`}
        >
          {styles.icon}
        </div>
        <p className={`min-w-0 flex-1 text-sm font-semibold leading-6 ${styles.text}`}>
          {message}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar aviso"
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-lg leading-none transition ${styles.iconText} ${styles.hover}`}
        >
          ×
        </button>
      </div>
      <div className={`h-1 ${styles.track}`}>
        <div
          className={`h-full transition-[width] duration-[5000ms] ease-linear ${styles.bar}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
