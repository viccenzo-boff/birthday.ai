import type { DeliveryLogDto } from "../types/messages";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

function buildMessagesUrl(path = "") {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_URL nao configurada.");
  }

  return `${API_BASE_URL}/api/mensagens${path}`;
}

async function request<T>(path = "", init?: RequestInit): Promise<T> {
  // 1. Criamos um novo objeto de cabeçalhos baseado nos originais (caso existam)
  const customHeaders = new Headers(init?.headers);
  
  // 2. Injetamos a "Chave Mestra" para ignorar a página de aviso do Ngrok
  customHeaders.set("ngrok-skip-browser-warning", "true");

  // 3. Montamos a configuração final do fetch
  const customInit: RequestInit = {
    ...init,
    headers: customHeaders,
  };

  const response = await fetch(buildMessagesUrl(path), customInit);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function sendAction(path: string, init?: RequestInit) {
  await request<{ sucesso?: boolean; mensagem?: string }>(path, init);
}

export function fetchMessages() {
  return request<DeliveryLogDto[]>();
}

export function approveMessage(id: string) {
  return sendAction(`/${id}/aprovar`, { method: "POST" });
}

export function rejectMessage(id: string) {
  return sendAction(`/${id}/reprovar`, { method: "POST" });
}

export function editMessage(id: string, novoTexto: string) {
  return sendAction(`/${id}/editar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ novoTexto }),
  });
}
