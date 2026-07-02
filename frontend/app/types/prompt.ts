export interface PromptDto {
  id: string;
  chave: string;
  versao: number;
  conteudo: string;
  ativo: boolean;
  criadoPor: string;
  criadoEm: string;
}

export interface CreatePromptPayload {
  chave: string;
  conteudo: string;
  criadoPor: string;
}
