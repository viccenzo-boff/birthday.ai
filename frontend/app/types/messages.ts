export type KnownBackendMessageStatus =
  | "PENDENTE"
  | "ENVIADO"
  | "SUCESSO"
  | "EDITADO"
  | "EDITADO_E_ENVIADO"
  | "REPROVADO";

export type BackendMessageStatus = KnownBackendMessageStatus | (string & {});

export type KnownHistoryStatus = "Enviado" | "Editado e Enviado" | "Reprovado";

export type HistoryStatus = KnownHistoryStatus | (string & {});

export interface BirthdayPersonDto {
  id: string;
  nome: string;
  apelido: string | null;
  data_nascimento: string;
  ativo: boolean;
  data_criacao?: string;
}

export interface DeliveryLogDto {
  id: string;
  status: BackendMessageStatus;
  mensagemOriginal: string;
  mensagemEditada: string | null;
  dataCriacao?: string;
  dataAtualizacao?: string;
  createdAt?: string;
  updatedAt?: string;
  aniversariante?: BirthdayPersonDto | null;
}

export interface PendingMessage {
  id: string;
  name: string;
  date: string;
  message: string;
  originalMessage: string;
  createdAtTime: string;
  status: "PENDENTE";
}

export interface HistoryItem {
  id: string;
  name: string;
  date: string;
  originalMessage: string;
  finalMessage: string;
  status: HistoryStatus;
  createdAtTime: string;
  actionTime: string;
}

export type DashboardMessage = PendingMessage | HistoryItem;
