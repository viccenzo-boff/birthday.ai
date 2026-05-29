import type {
  BackendMessageStatus,
  DashboardMessage,
  DeliveryLogDto,
  HistoryItem,
  HistoryStatus,
  PendingMessage,
} from "../types/messages";

export function extractTime(dateString?: string) {
  if (!dateString) return "--:--";

  return new Date(dateString).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function convertBrazilianDateToInputDate(date: string) {
  const [day, month, year] = date.split("/");
  return `${year}-${month}-${day}`;
}

function normalizeStatus(status: BackendMessageStatus): "PENDENTE" | HistoryStatus {
  switch (status) {
    case "PENDENTE":
      return "PENDENTE";
    case "ENVIADO":
    case "SUCESSO":
      return "Enviado";
    case "EDITADO":
    case "EDITADO_E_ENVIADO":
      return "Editado e Enviado";
    case "REPROVADO":
      return "Reprovado";
    default:
      return status;
  }
}

export function toDashboardMessage(item: DeliveryLogDto): DashboardMessage {
  const status = normalizeStatus(item.status);
  const name = item.aniversariante?.nome || item.aniversariante?.apelido || "Sem Nome";
  const date = item.aniversariante?.data_nascimento
    ? new Date(item.aniversariante.data_nascimento).toLocaleDateString("pt-BR", {
        timeZone: "UTC",
      })
    : "00/00/0000";
  const originalMessage = item.mensagemOriginal || "";
  const finalMessage = item.mensagemEditada || item.mensagemOriginal || "";
  const createdAtTime = extractTime(item.createdAt || item.dataCriacao);

  if (status === "PENDENTE") {
    return {
      id: item.id,
      name,
      date,
      originalMessage,
      message: finalMessage,
      createdAtTime,
      status: "PENDENTE",
    };
  }

  return {
    id: item.id,
    name,
    date,
    originalMessage,
    finalMessage,
    status,
    createdAtTime,
    actionTime: extractTime(item.updatedAt || item.dataAtualizacao),
  };
}

export function isPendingMessage(message: DashboardMessage): message is PendingMessage {
  return message.status === "PENDENTE";
}

export function isHistoryItem(message: DashboardMessage): message is HistoryItem {
  return message.status !== "PENDENTE";
}
