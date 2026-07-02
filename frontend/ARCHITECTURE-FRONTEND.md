# Frontend Architecture Document - Birthday.ai

## 1. Visão Geral (Overview)
O front-end do **Birthday.ai** atua como o "Painel de Triagem" (Triage Dashboard) e o centro de comando do administrador. É a interface visual que materializa o conceito de "Human-in-the-Loop", permitindo gerenciar os Prompts da IA e revisar, editar, aprovar ou reprovar as mensagens de aniversário pendentes antes do disparo pelo WhatsApp.

## 2. Stack Tecnológico
* **Framework Core:** Next.js `16.2.6` (utilizando o paradigma do App Router `app/`).
* **Biblioteca de UI:** React.js `19.2.4` (`react-dom` `19.2.4`).
* **Linguagem:** TypeScript `^5` (Tipagem rigorosa espelhada com os contratos do Back-end).
* **Estilização:** Tailwind CSS `^4.3.0` (processado via `@tailwindcss/postcss` `^4` + PostCSS `^8.5.14` + Autoprefixer `^10.5.0`).
* **Ícones/Componentes de UI:** `lucide-react` `^1.21.0` (biblioteca de ícones SVG) — demais componentes continuam construídos manualmente com utilitários do Tailwind CSS (ver `Toast.tsx` como referência de padrão atual).
* **Autenticação/BaaS:** Supabase Auth via `@supabase/ssr` `^0.10.3` e `@supabase/supabase-js` `^2.107.0` (Integrado via utilitários no lado do servidor/cliente).
* **PWA:** `@ducanh2912/next-pwa` `^10.2.9`.
* **Comunicação de Rede:** Fetch API / Axios encapsulados em serviços dedicados (`lib/api.ts`).
* **Lint/Build:** ESLint `^9` com `eslint-config-next` `16.2.6`.

## 3. Padrões de Projeto e Regras de Código (Design Patterns)
Para manter o front-end escalável e de fácil manutenção, a IA (Claude) deve seguir as seguintes diretrizes:
1. **Server Components vs Client Components:**
   * Priorizar a renderização no servidor (SSR) e *React Server Components* por padrão para ganho de performance e segurança.
   * Utilizar a diretiva `"use client"` estritamente no topo de arquivos que necessitam de interatividade do usuário (ex: botões de aprovar/editar, gerenciamento de estado local com `useState`).
2. **Isolamento da Camada de API:**
   * Componentes visuais **não devem** fazer chamadas HTTP diretas soltas no código. 
   * Todas as requisições para a API do back-end (`localhost:3333`) ou chamadas ao Supabase devem ser encapsuladas em funções no diretório `app/lib/` ou `utils/`.
3. **Tipagem Compartilhada (Single Source of Truth):**
   * Manter os arquivos dentro de `app/types/` rigorosamente alinhados com o esquema do Prisma (Back-end) para evitar dados indefinidos na renderização.
4. **Componentização (Atomic Design simplificado):**
   * Fragmentar UIs complexas em componentes burros/apresentacionais (ex: `Metric.tsx`, `EmptyState.tsx`) dentro de `app/components/`.

## 4. Estrutura de Diretórios (Directory Tree)
A organização das pastas obedece à convenção do Next.js App Router:

```text
frontend/
├── app/
│   ├── layout.tsx         # Root layout (Provider de estado global, fontes, meta-tags)
│   ├── page.tsx           # Página inicial (Dashboard de métricas e lista de pendências)
│   ├── globals.css        # Variáveis globais do Tailwind CSS
│   ├── login/             # Rota de autenticação
│   │   └── page.tsx       # UI de login do administrador
│   ├── components/        # UI Components reutilizáveis
│   │   ├── PendingCard.tsx    # Card de revisão da mensagem (Aprovar/Editar/Reprovar)
│   │   ├── HistoryCard.tsx    # Card de histórico de prompts
│   │   ├── MessagePreview.tsx # Preview do texto substituindo `{{nome}}`
│   │   ├── Metric.tsx         # Indicadores (ex: Mensagens enviadas, Pendentes)
│   │   └── EmptyState.tsx     # Feedback visual para listas vazias
│   ├── lib/               # Funções de Serviço e Fetchers
│   │   ├── api.ts         # Instância e métodos de requisição ao Back-end Node.js
│   │   └── messages.ts    # Regras de negócio do front-end para mensagens
│   └── types/             # Interfaces e Types (TypeScript)
│       └── messages.ts    # Tipos como `LogEnvio`, `Prompt`, `Aniversariante`
├── utils/
│   └── supabase/          # Configuração do cliente do Supabase
│       └── server.ts      # Cliente Supabase tipado para SSR e middlewares
└── proxy.ts               # Proxy local para roteamento de ambiente de dev

5. Fluxos Principais de Interface (Core UI Flows)
5.1. Fluxo de Triagem (Triage Flow)
O administrador acessa a raiz (/).

O front-end consome a API do back-end buscando LogEnvio com status PENDENTE.

A lista é renderizada utilizando instâncias do PendingCard.tsx.

Ações de clique disparam payloads para o Back-end:

Aprovar: Envia PUT mudando status para APROVADO.

Editar: Abre um input controlável, permitindo alteração antes do PUT.

Reprovar: Envia PUT cancelando o envio.

5.2. Fluxo de Engenharia de Prompts (Prompt Flow)
Interface dedicada para visualizar o Prompt Ativo atual e a lista de versões anteriores (HistoryCard.tsx).

Formulário para criar uma nova regra. Ao submeter, faz um POST para o back-end, que lida com a inativação do antigo e retorno da nova versão ativa para atualizar o estado do React instantaneamente.