# Backend Architecture Document - Birthday.ai

## 1. Visão Geral (Overview)
O back-end do **Birthday.ai** é uma API RESTful construída em Node.js. Ele atua como o maestro do sistema, orquestrando o banco de dados, o agendador de tarefas cron, a comunicação com a API de IA generativa (Google Gemini) e a integração com o cliente do WhatsApp.

## 2. Stack Tecnológico
* **Linguagem:** TypeScript `^6.0.3` (Tipagem estrita, compilação limpa com `npx tsc --noEmit`).
* **Framework Web:** Express.js `^5.2.1`.
* **ORM:** Prisma `^7.8.0` (`@prisma/client` `^7.8.0`).
* **Banco de Dados:** PostgreSQL (Hospedado no Supabase em produção).
* **Driver de Conexão:** `pg` `^8.21.0` + `@prisma/adapter-pg` `^7.8.0` (otimizado para o PgBouncer do Supabase na porta 6543).
* **Banco de Dados Local (Dev):** PostgreSQL via Docker (`backend/docker-compose.yml`), subindo na porta 5432 com as mesmas migrations do Supabase. `DATABASE_URL`/`DIRECT_URL` do `.env` apontam para esse container em desenvolvimento; basta trocar para a connection string do Supabase ao implantar em produção.
* **Inteligência Artificial:** Google Gemini API (Modelo 2.5 Pro/Flash) via `@google/generative-ai` `^0.24.1`.
* **Agendamento de Tarefas:** `node-cron` `^4.2.1` (motor do `scheduler.ts`).
* **Mensageria:** `whatsapp-web.js` `^1.34.7` (sessão autenticada via QR Code com `qrcode-terminal` `^0.12.0`).
* **Middleware HTTP:** `cors` `^2.8.6`.
* **Tunelamento (Dev):** `ngrok` `^5.0.0-beta.2` (exposição do servidor local para testes de webhook/integração).
* **Execução/Build (Dev):** `ts-node` `^10.9.2` / `tsx` `^4.22.3` para rodar TypeScript diretamente em desenvolvimento.

## 3. Padrões de Projeto e Regras de Código (Design Patterns)
Para manter a coesão e a escalabilidade, a IA agente (Claude) e os desenvolvedores devem seguir estritamente as regras abaixo:
1. **Separação de Responsabilidades (Repository/Service Pattern):** 
   * As rotas (`src/routes/`) não devem conter regras de negócio complexas. Elas apenas recebem a requisição HTTP, chamam o serviço apropriado e retornam a resposta.
   * Toda lógica de negócio (ex: gerenciar promtps, disparar agendamentos, parse de variáveis) deve residir isolada em `src/services/`.
2. **Tratamento de Erros Centralizado:** 
   * Nenhum `console.log` solto. Utilizar o `src/lib/logger.ts`.
   * Todo catch em rotas deve delegar o erro para a função `handleRouteError` (`src/lib/http.ts`), que mapeia erros do Prisma (ex: P2002 para 409, P2025 para 404) e padroniza o JSON de saída.
3. **Transações (ACID):** 
   * Operações que alteram múltiplos registros dependentes (como atualizar a versão de um prompt) devem obrigatoriamente usar `prisma.$transaction` para evitar estado inconsistente.

## 4. Estrutura de Diretórios (Directory Tree)
A árvore de arquivos reflete uma arquitetura modular:

```text
backend/
├── docker-compose.yml     # Postgres local para desenvolvimento (espelha o schema do Supabase)
├── prisma/
│   ├── schema.prisma      # Definição do banco e relacionamentos
│   ├── seed.ts            # Script para semear a base inicial
│   └── migrations/        # Histórico de alterações estruturais
├── src/
│   ├── index.ts           # Entry point: Inicializa o Express, Agendador e WhatsApp
│   ├── lib/               # Configurações core (Instâncias únicas)
│   │   ├── prisma.ts      # PrismaClient injetado com Pool Adapter (Supabase)
│   │   ├── logger.ts      # Logger padronizado
│   │   └── http.ts        # Helper de tratamento de erros HTTP
│   ├── routes/            # Endpoints da API (Express Routers)
│   │   ├── messages.ts    # CRUD e aprovação de LogEnvio
│   │   └── prompts.ts     # CRUD de Prompts
│   └── services/          # Regras de Negócio
│       ├── prompts.ts     # Lógica de versionamento e `buscarOuCriarPromptAtivo`
│       ├── scheduler.ts   # Varredura diária, parsing `{{nome}}` e requisição ao Gemini
│       └── whatsapp.ts    # Manutenção da sessão e disparo real via WhatsApp

## 5. Modelagem de Dados (Data Layer)
O banco relacional baseia-se em 3 entidades principais estritamente ligadas:

Aniversariante: Armazena os dados do destinatário final (nome, data de nascimento, status de atividade).

Prompt: Tabela versionada. Possui os campos chave e versao (Unique Compound). Apenas uma linha por chave pode ter ativo: true.

LogEnvio: A tabela central de rastreabilidade e aprovação ("Human-in-the-loop").

Possui status transitórios (ex: PENDENTE, APROVADO, REPROVADO).

Relaciona-se obrigatoriamente com o Aniversariante.

Relaciona-se obrigatoriamente com o Prompt (promptId) que originou a mensagem, garantindo que a engenharia de prompt possa ser auditada.

## 6. Fluxo Assíncrono do Agendador (Scheduler Flow)
O arquivo scheduler.ts dita o motor de automação e deve operar no seguinte fluxo seguro:

Verifica se há aniversariantes no dia atual.

Consulta o Prompt com ativo: true para a chave GERAR_ANIVERSARIO via serviço isolado. Se não houver, semeia a versão V1 como fallback.

Substitui os placeholders ({{nome}}) pelos dados do aniversariante da iteração.

Consulta a API do Gemini via chamada encapsulada.

Salva o resultado em LogEnvio com o status inicial PENDENTE e amarra o promptId.

(Futuro) Aciona o whatsapp.ts para enviar notificação aos administradores informando que a triagem aguarda revisão.