import type { PendingMessage } from "../types/messages";

interface PendingCardProps {
  item: PendingMessage;
  isEditing: boolean;
  draftMessage: string;
  onDraftChange: (message: string) => void;
  onApprove: () => void;
  onEdit: () => void;
  onReject: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}

export function PendingCard({
  item,
  isEditing,
  draftMessage,
  onDraftChange,
  onApprove,
  onEdit,
  onReject,
  onSaveEdit,
  onCancelEdit,
}: PendingCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">{item.name}</h3>
          <p className="text-sm text-slate-500">
            Aniversário em {item.date} •{" "}
            <span className="font-medium text-slate-400">Recebido às {item.createdAtTime}</span>
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
