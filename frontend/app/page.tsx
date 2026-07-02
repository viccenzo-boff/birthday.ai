"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { EmptyState } from "./components/EmptyState";
import { HistoryCard } from "./components/HistoryCard";
import { Metric } from "./components/Metric";
import { PendingCard } from "./components/PendingCard";
import { Toast, type ToastState } from "./components/Toast";
import { UserMenu } from "./components/UserMenu";
import {
  approveMessage,
  createPromptVersion,
  editMessage,
  fetchActivePrompt,
  fetchMessages,
  fetchPromptHistory,
  rejectMessage,
} from "./lib/api";
import {
  convertBrazilianDateToInputDate,
  isHistoryItem,
  isPendingMessage,
  toDashboardMessage,
} from "./lib/messages";
import type { HistoryItem, PendingMessage } from "./types/messages";
import type { PromptDto } from "./types/prompt";

type Section = "approval" | "prompt";

const PROMPT_CHAVE = "GERAR_ANIVERSARIO";

const itemsPerPageOptions = [5, 10, 25];
const promptHistoryPageSizeOptions = [4, 8, 12];
const apiErrorMessage =
  "Nao foi possivel conectar a API. Verifique se o backend esta rodando e tente novamente.";
const promptApiErrorMessage =
  "Nao foi possivel carregar os prompts. Verifique se o backend esta rodando e tente novamente.";

const previewMessage =
  "Feliz aniversário, teste! Que seu novo ciclo seja leve, feliz e cheio de boas notícias. Todos aqui desejam um dia especial e momentos que façam você sorrir.";

export default function Home() {
  const [supabase] = useState(() => createClient());
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
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [versions, setVersions] = useState<PromptDto[]>([]);
  const [promptsLoading, setPromptsLoading] = useState(true);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null);
  const [preview, setPreview] = useState(previewMessage);
  const [toast, setToast] = useState<ToastState | null>(null);

  const activeVersion = versions.find((version) => version.ativo) ?? versions[0] ?? null;

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

  const loadPrompts = useCallback(async () => {
    setPromptsLoading(true);

    try {
      const promptHistory = await fetchPromptHistory();
      setVersions(promptHistory);
      setPromptError(null);
    } catch {
      setPromptError(promptApiErrorMessage);
    }

    try {
      const promptAtivo = await fetchActivePrompt(PROMPT_CHAVE);
      setPrompt(promptAtivo.conteudo);
    } catch {
      // Nenhum prompt ativo cadastrado ainda para esta chave.
    }

    setPromptsLoading(false);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadMessages();
      void loadPrompts();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadMessages, loadPrompts]);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (isMounted) {
        setAdminEmail(data.user?.email ?? null);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [supabase]);

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

  function showToast(message: string, variant: ToastState["variant"]) {
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

  async function saveVersion() {
    if (!activeVersion) return;

    if (!prompt.trim() || prompt.trim() === activeVersion.conteudo.trim()) {
      showToast("Altere o prompt antes de salvar!", "warning");
      return;
    }

    setIsSavingPrompt(true);

    try {
      await createPromptVersion({
        chave: PROMPT_CHAVE,
        conteudo: prompt.trim(),
        criadoPor: adminEmail ?? "desconhecido",
      });

      await loadPrompts();
      setPreview("");
      showToast("Novo prompt salvo com sucesso!", "success");
    } catch {
      showToast("Nao foi possivel salvar a nova versao do prompt.", "warning");
    } finally {
      setIsSavingPrompt(false);
    }
  }

  async function restoreVersion(version: PromptDto) {
    setRestoringVersionId(version.id);

    try {
      await createPromptVersion({
        chave: PROMPT_CHAVE,
        conteudo: version.conteudo,
        criadoPor: adminEmail ?? "desconhecido",
      });

      await loadPrompts();
      setPreview("");
      showToast("Prompt restaurado com sucesso!", "success");
    } catch {
      showToast("Nao foi possivel restaurar esta versao do prompt.", "warning");
    } finally {
      setRestoringVersionId(null);
    }
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
            <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-6">
              <div className="flex items-center justify-between gap-4">
                <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
                  {section === "approval" ? "Painel de Aprovação" : "Configuração do Prompt"}
                </h1>

                <UserMenu />
              </div>

              {section === "approval" ? (
                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4 xl:w-fit">
                  <Metric label="Pendentes" value={pendingMessages.length} />
                  <Metric label="Enviadas" value={stats.sent} />
                  <Metric label="Editadas" value={stats.edited} />
                  <Metric label="Reprovadas" value={stats.rejected} />
                </div>
              ) : null}
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
              promptError={promptError}
              activeVersion={activeVersion}
              prompt={prompt}
              preview={preview}
              versions={versions}
              isLoading={promptsLoading}
              isSaving={isSavingPrompt}
              restoringVersionId={restoringVersionId}
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
  promptError: string | null;
  activeVersion: PromptDto | null;
  prompt: string;
  preview: string;
  versions: PromptDto[];
  isLoading: boolean;
  isSaving: boolean;
  restoringVersionId: string | null;
  onPromptChange: (value: string) => void;
  onSaveVersion: () => void;
  onRestoreVersion: (version: PromptDto) => void;
  onGeneratePreview: () => void;
}

function PromptPanel({
  promptError,
  activeVersion,
  prompt,
  preview,
  versions,
  isLoading,
  isSaving,
  restoringVersionId,
  onPromptChange,
  onSaveVersion,
  onRestoreVersion,
  onGeneratePreview,
}: PromptPanelProps) {
  const [historySearch, setHistorySearch] = useState("");
  const [historyDate, setHistoryDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(4);
  const isActionInProgress = isSaving || restoringVersionId !== null;
  const hasPromptChanges =
    !isLoading &&
    activeVersion !== null &&
    prompt.trim().length > 0 &&
    prompt.trim() !== activeVersion.conteudo.trim();

  const filteredVersions = useMemo(() => {
    const normalizedSearch = historySearch.trim().toLowerCase();

    return versions.filter((version) => {
      const matchesMessage = version.conteudo.toLowerCase().includes(normalizedSearch);
      const matchesDate = historyDate ? version.criadoEm.slice(0, 10) === historyDate : true;

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
    <>
      {promptError ? (
        <div className="mx-auto mt-6 max-w-7xl px-6">
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
          >
            {promptError}
          </div>
        </div>
      ) : null}

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Prompt Atual</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {activeVersion
                      ? `Ativo desde ${new Date(activeVersion.criadoEm).toLocaleString("pt-BR")}`
                      : isLoading
                        ? "Carregando prompt ativo..."
                        : "Nenhum prompt ativo encontrado."}
                  </p>
                </div>
                {activeVersion ? (
                  <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    Versão ativa
                  </span>
                ) : null}
              </div>
            </div>

            <div className="p-5">
              <textarea
                value={prompt}
                onChange={(event) => onPromptChange(event.target.value)}
                disabled={isLoading}
                placeholder={isLoading ? "Carregando prompt ativo..." : undefined}
                className="min-h-72 w-full resize-y rounded-md border border-slate-300 bg-white p-4 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
              />

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onGeneratePreview}
                  disabled={isLoading}
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Gerar prévia
                </button>
                <button
                  type="button"
                  onClick={onSaveVersion}
                  disabled={isLoading || isActionInProgress}
                  aria-disabled={!hasPromptChanges || isActionInProgress}
                  className={`inline-flex min-h-11 items-center justify-center rounded-md px-5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    hasPromptChanges && !isActionInProgress
                      ? "bg-slate-950 hover:bg-slate-800"
                      : "bg-slate-500 hover:bg-slate-600"
                  }`}
                >
                  {isSaving ? "Salvando..." : "Salvar nova versão"}
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
            {isLoading ? (
              Array.from({ length: itemsPerPage }).map((_, index) => (
                <PromptVersionCardSkeleton key={index} />
              ))
            ) : paginatedVersions.length > 0 ? (
              paginatedVersions.map((version) => (
                <article
                  key={version.id}
                  className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        {new Date(version.criadoEm).toLocaleString("pt-BR")}
                      </p>
                      <p className="mt-1 text-xs font-medium uppercase text-slate-500">
                        {version.criadoPor}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      v{version.versao}
                    </span>
                  </div>

                  <p className="mt-4 line-clamp-4 whitespace-pre-line text-sm leading-6 text-slate-600">
                    {version.conteudo}
                  </p>

                  <button
                    type="button"
                    onClick={() => onRestoreVersion(version)}
                    disabled={isActionInProgress}
                    className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {restoringVersionId === version.id ? "Restaurando..." : "Restaurar esta versão"}
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
              <dd className="font-semibold text-slate-950">
                {activeVersion ? `v${activeVersion.versao}` : "--"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">Versões salvas</dt>
              <dd className="font-semibold text-slate-950">{versions.length}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">Criado por</dt>
              <dd className="font-semibold text-slate-950">{activeVersion?.criadoPor ?? "--"}</dd>
            </div>
          </dl>
        </section>
      </aside>
      </div>
    </>
  );
}

function PromptVersionCardSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="h-4 w-32 rounded bg-slate-200" />
          <div className="h-3 w-24 rounded bg-slate-100" />
        </div>
        <div className="h-5 w-8 rounded-full bg-slate-200" />
      </div>

      <div className="mt-4 space-y-2">
        <div className="h-3 w-full rounded bg-slate-100" />
        <div className="h-3 w-full rounded bg-slate-100" />
        <div className="h-3 w-2/3 rounded bg-slate-100" />
      </div>

      <div className="mt-4 h-10 w-full rounded-md bg-slate-100" />
    </div>
  );
}
