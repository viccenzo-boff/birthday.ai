import { MessagePreview } from "./MessagePreview";
import type { HistoryItem, KnownHistoryStatus } from "../types/messages";

const statusStyles: Record<KnownHistoryStatus, string> = {
  Enviado: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  "Editado e Enviado": "bg-sky-100 text-sky-700 ring-sky-200",
  Reprovado: "bg-rose-100 text-rose-700 ring-rose-200",
};

interface HistoryCardProps {
  item: HistoryItem;
}

export function HistoryCard({ item }: HistoryCardProps) {
  const statusStyle =
    item.status in statusStyles
      ? statusStyles[item.status as KnownHistoryStatus]
      : "bg-slate-100 text-slate-700 ring-slate-200";

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
          className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusStyle}`}
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
