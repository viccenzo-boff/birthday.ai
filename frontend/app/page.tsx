"use client";

import React, { useState, useMemo, useEffect } from "react";

type PendingMessage = {
  id: string;
  name: string;
  date: string;
  message: string;
  originalMessage: string;
  createdAtTime: string; // Novo campo para o horário de chegada
};

type HistoryStatus = "Enviado" | "Editado e Enviado" | "Reprovado";

type HistoryItem = {
  id: string;
  name: string;
  date: string;
  originalMessage: string;
  finalMessage: string;
  status: HistoryStatus;
  createdAtTime: string; // Novo campo para o horário de chegada
  actionTime: string;    // Novo campo para o horário da ação (aprovação/reprovação)
};

const statusStyles: Record<HistoryStatus, string> = {
  Enviado: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  "Editado e Enviado": "bg-sky-100 text-sky-700 ring-sky-200",
  Reprovado: "bg-rose-100 text-rose-700 ring-rose-200",
};

const itemsPerPageOptions = [5, 10, 25];

// Função auxiliar para extrair apenas as horas e minutos (Ex: "08:00")
function extractTime(dateString?: string) {
  if (!dateString) return "--:--";
  return new Date(dateString).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Home() {
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [historyDate, setHistoryDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const carregarMensagens = () => {
    fetch("http://localhost:3333/api/mensagens")
      .then((response) => response.json())
      .then((data) => {
        const mensagensFormatadas = data.map((item: any) => {
          let visualStatus = item.status;
          if (item.status === "ENVIADO" || item.status === "SUCESSO") visualStatus = "Enviado";
          if (item.status === "EDITADO" || item.status === "EDITADO_E_ENVIADO") visualStatus = "Editado e Enviado";
          if (item.status === "REPROVADO") visualStatus = "Reprovado";

          return {
            id: item.id,
            name: item.aniversariante?.nome || item.aniversariante?.apelido || "Sem Nome",
            date: item.aniversariante?.data_nascimento
              ? new Date(item.aniversariante.data_nascimento).toLocaleDateString("pt-BR", { timeZone: "UTC" })
              : "00/00/0000",
            originalMessage: item.mensagemOriginal || "",
            message: item.mensagemEditada || item.mensagemOriginal || "",
            finalMessage: item.mensagemEditada || item.mensagemOriginal || "",
            status: visualStatus,
            // Captura as datas de criação e atualização que vêm do banco de dados
            createdAtTime: extractTime(item.createdAt || item.dataCriacao),
            actionTime: extractTime(item.updatedAt || item.dataAtualizacao),
          };
        });

        const filaPendentes = mensagensFormatadas.filter((msg: any) => msg.status === "PENDENTE");
        setPendingMessages(filaPendentes);

        const filaHistorico = mensagensFormatadas.filter((msg: any) => msg.status !== "PENDENTE");
        setHistory(filaHistorico);
      })
      .catch((error) => console.error("❌ Erro ao carregar mensagens reais:", error));
  };

  useEffect(() => {
    carregarMensagens();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await fetch(`http://localhost:3333/api/mensagens/${id}/aprovar`, { method: "POST" });
      carregarMensagens();
    } catch (error) {
      console.error("Erro ao aprovar:", error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await fetch(`http://localhost:3333/api/mensagens/${id}/reprovar`, { method: "POST" });
      carregarMensagens();
    } catch (error) {
      console.error("Erro ao reprovar:", error);
    }
  };

  const handleSaveEdit = async () => {
    if (editingId && draftMessage.trim()) {
      try {
        await fetch(`http://localhost:3333/api/mensagens/${editingId}/editar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ novoTexto: draftMessage }),
        });
        setEditingId(null);
        setDraftMessage("");
        carregarMensagens();
      } catch (error) {
        console.error("Erro ao editar:", error);
      }
    }
  };

  const approveAllPending = async () => {
    if (pendingMessages.length === 0) return;
    try {
      await Promise.all(
        pendingMessages.map((msg) =>
          fetch(`http://localhost:3333/api/mensagens/${msg.id}/aprovar`, { method: "POST" })
        )
      );
      carregarMensagens();
    } catch (error) {
      console.error("Erro ao aprovar todos:", error);
    }
  };

  function startEditing(item: PendingMessage) {
    setEditingId(item.id);
    setDraftMessage(item.message);
  }

  function cancelEdit() {
    setEditingId(null);
    setDraftMessage("");
  }

  const pendingCount = pendingMessages.length;

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

  const historyStartResult = totalHistoryResults === 0 ? 0 : (safeCurrentPage - 1) * itemsPerPage + 1;
  const historyEndResult = Math.min(safeCurrentPage * itemsPerPage, totalHistoryResults);

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
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">
              Birthday.ai - Painel de Aprovação
            </h1>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Metric label="Pendentes" value={pendingCount} />
            <Metric label="Enviadas" value={stats.sent} />
            <Metric label="Editadas" value={stats.edited} />
            <Metric label="Reprovadas" value={stats.rejected} />
          </div>
        </div>
      </header>

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
              onClick={approveAllPending}
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
                  onDraftChange={setDraftMessage}
                  onApprove={() => handleApprove(item.id)}
                  onEdit={() => startEditing(item)}
                  onReject={() => handleReject(item.id)}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={cancelEdit}
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
                  onChange={(event) => updateHistorySearch(event.target.value)}
                  placeholder="Buscar aniversariante"
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

          <div className="space-y-4 p-5">
            {paginatedHistory.length > 0 ? (
              paginatedHistory.map((item) => <HistoryCard key={item.id} item={item} />)
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
                  onChange={(event) => updateItemsPerPage(event.target.value)}
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
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function PendingCard({
  item,
  isEditing,
  draftMessage,
  onDraftChange,
  onApprove,
  onEdit,
  onReject,
  onSaveEdit,
  onCancelEdit,
}: {
  item: PendingMessage;
  isEditing: boolean;
  draftMessage: string;
  onDraftChange: (message: string) => void;
  onApprove: () => void;
  onEdit: () => void;
  onReject: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">{item.name}</h3>
          <p className="text-sm text-slate-500">
            Aniversário em {item.date} • <span className="font-medium text-slate-400">Recebido às {item.createdAtTime}</span>
          </p>
        </div>
        <span className="w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
          Pendente
        </span>
      </div>

      <div className="mt-4 rounded-md bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase text-slate-500">Mensagem gerada</p>
        {isEditing ? (
          <textarea
            value={draftMessage}
            onChange={(event) => onDraftChange(event.target.value)}
            className="mt-3 min-h-32 w-full resize-y rounded-md border border-slate-300 bg-white p-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
          />
        ) : (
          <p className="mt-2 text-sm leading-6 text-slate-700">{item.message}</p>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        {isEditing ? (
          <>
            <button
              type="button"
              onClick={onSaveEdit}
              className="inline-flex min-h-10 flex-1 items-center justify-center rounded-md bg-sky-600 px-4 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              Salvar edição
            </button>
            <button
              type="button"
              onClick={onCancelEdit}
              className="inline-flex min-h-10 flex-1 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onApprove}
              className="inline-flex min-h-10 flex-1 items-center justify-center rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Aprovar
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex min-h-10 flex-1 items-center justify-center rounded-md bg-sky-600 px-4 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={onReject}
              className="inline-flex min-h-10 flex-1 items-center justify-center rounded-md bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700"
            >
              Reprovar
            </button>
          </>
        )}
      </div>
    </article>
  );
}

function HistoryCard({ item }: { item: HistoryItem }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-950">{item.name}</h3>
          <p className="text-sm text-slate-500">Aniversário em {item.date}</p>
          <p className="mt-1 flex items-center gap-2 text-xs text-slate-400">
            <span>Recebido às {item.createdAtTime}</span>
            <span>•</span>
            <span className="font-medium text-slate-500">Ação às {item.actionTime}</span>
          </p>
        </div>
        <span
          className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusStyles[item.status]}`}
        >
          {item.status}
        </span>
      </div>

      {item.status === "Editado e Enviado" ? (
        <div className="mt-4 grid gap-3">
          <MessagePreview title="Original" text={item.originalMessage} muted />
          <MessagePreview title="Nova mensagem" text={item.finalMessage} />
        </div>
      ) : (
        <div className="mt-4">
          <MessagePreview
            title={item.status === "Reprovado" ? "Mensagem cancelada" : "Mensagem enviada"}
            text={item.finalMessage}
            muted={item.status === "Reprovado"}
          />
        </div>
      )}
    </article>
  );
}

function MessagePreview({ title, text, muted = false }: { title: string; text: string; muted?: boolean }) {
  return (
    <div
      className={`rounded-md border p-3 ${
        muted ? "border-slate-200 bg-slate-50 text-slate-500" : "border-sky-100 bg-sky-50 text-slate-700"
      }`}
    >
      <p className="text-xs font-semibold uppercase text-slate-500">{title}</p>
      <p className="mt-2 text-sm leading-6">{text}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-medium text-slate-500">
      {text}
    </div>
  );
}

function convertBrazilianDateToInputDate(date: string) {
  const [day, month, year] = date.split("/");
  return `${year}-${month}-${day}`;
}