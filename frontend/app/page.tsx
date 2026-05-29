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

const itemsPerPageOptions = [5, 10, 25];

export default function Home() {
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [historyDate, setHistoryDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const loadMessages = useCallback(async () => {
    try {
      const messages = await fetchMessages();
      const dashboardMessages = messages.map(toDashboardMessage);

      setPendingMessages(dashboardMessages.filter(isPendingMessage));
      setHistory(dashboardMessages.filter(isHistoryItem));
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadMessages();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadMessages]);

  const handleApprove = async (id: string) => {
    try {
      await approveMessage(id);
      await loadMessages();
    } catch (error) {
      console.error("Erro ao aprovar:", error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectMessage(id);
      await loadMessages();
    } catch (error) {
      console.error("Erro ao reprovar:", error);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId || !draftMessage.trim()) return;

    try {
      await editMessage(editingId, draftMessage);
      setEditingId(null);
      setDraftMessage("");
      await loadMessages();
    } catch (error) {
      console.error("Erro ao editar:", error);
    }
  };

  const approveAllPending = async () => {
    if (pendingMessages.length === 0) return;

    try {
      await Promise.all(pendingMessages.map((message) => approveMessage(message.id)));
      await loadMessages();
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
