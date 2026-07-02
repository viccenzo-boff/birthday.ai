# Product Requirements Document (PRD) - Birthday.ai

## 1. Visão Geral (Overview)
O **Birthday.ai** é um sistema automatizado com inteligência artificial "Human-in-the-Loop" desenhado para o gerenciamento, geração e disparo de mensagens de felicitações de aniversário via WhatsApp. 
O sistema substitui o processo manual de lembrar de datas e redigir mensagens, garantindo que os aniversariantes recebam textos exclusivos, calorosos e contextualizados, enquanto mantém o controle final e a segurança nas mãos do administrador.

## 2. Problema e Solução
* **O Problema:** Em grupos corporativos, comunidades ou círculos sociais amplos, monitorar datas de aniversário e redigir mensagens originais consome tempo. Mensagens padronizadas ("Feliz aniversário, tudo de bom") soam robóticas e perdem o valor humano.
* **A Solução:** Um agendador inteligente que cruza datas de nascimento, utiliza Modelos de Linguagem de Grande Escala (LLMs) para gerar mensagens personalizadas com diretrizes estritas de tom de voz, e as retém em um painel web ("Dashboard de Triagem"). O administrador revisa, edita (se necessário) e aprova a mensagem com um clique, disparando-a automaticamente no WhatsApp.

## 3. Perfis de Usuário (Personas)
1. **Administrador / Operador do Sistema:** Usuário autenticado que gerencia a base de dados, calibra os prompts da IA e aprova/reprova o envio de mensagens diárias pelo smartphone ou PC.
2. **Aniversariante (Destinatário):** O indivíduo final que recebe a mensagem de congratulação formatada e naturalizada.

## 4. Funcionalidades Atuais (Core Features)

### 4.1. Motor de Inteligência Artificial e Prompts
O sistema consome a API do Google Gemini para gerar as mensagens de aniversário. Variáveis no texto do prompt (ex.: `{{nome}}`) são substituídas pelos dados reais do aniversariante antes do envio à IA. O versionamento de prompts é mantido no banco de dados, com histórico completo e apenas uma versão ativa por chave, atualizada de forma atômica sempre que uma nova versão é criada.

O painel administrativo (aba "Prompt") está integrado a esses dados reais via Prisma: ao carregar, busca o prompt ativo (`GET /api/prompts/ativo/:chave`) e o histórico completo (`GET /api/prompts`) para preencher o editor e a tabela de versões; salvar uma nova versão ou restaurar uma versão antiga aciona `POST /api/prompts`. A interface exibe skeleton de carregamento na tabela, desabilita os botões de ação durante a requisição (evitando cliques concorrentes) e notifica sucesso ou falha de cada operação via toast.

### 4.2. Agendador (Scheduler)
Uma rotina automática varre periodicamente a base de aniversariantes em horário comercial, identifica quem faz aniversário no dia e gera a mensagem correspondente. Antes de criar um novo registro, o sistema verifica se já existe um envio para aquela pessoa naquele dia, evitando duplicidade.

### 4.3. Fluxo de Aprovação (Human-in-the-Loop)
Nenhuma mensagem chega ao destinatário final sem revisão humana. O Painel de Triagem exibe as mensagens pendentes, com métricas dinâmicas e histórico pesquisável. O administrador pode Aprovar, Editar e Aprovar ou Reprovar cada mensagem; toda ação é refletida imediatamente na interface e persistida no log de envio.

### 4.4. Integração com WhatsApp
A sessão do WhatsApp é mantida de forma automatizada (headless, autenticada via QR Code). Mensagens aprovadas são efetivamente disparadas para o grupo configurado.

### 4.5. Autenticação e Gerenciamento de Sessão
O painel exige login com e-mail e senha via Supabase Auth. O administrador autenticado é identificado por um avatar no cabeçalho (inicial do e-mail), com menu de gerenciamento de conta que permite encerrar a sessão de forma segura, com feedback de carregamento e redirecionamento automático para a tela de login.

### 4.6. Auditoria e Rastreabilidade
Todo ciclo de envio gera um `LogEnvio`, vinculado obrigatoriamente ao aniversariante e à versão do prompt que originou a mensagem. O log armazena tanto o texto original gerado pela IA quanto o texto final, caso editado, garantindo rastreabilidade completa.

## 5. Backlog / Em Desenvolvimento

* **Prévia de mensagem com IA real:** a pré-visualização de mensagem ainda retorna um texto fixo, sem consultar o motor de geração.
* **Proteção das rotas autenticadas:** não há verificação de sessão ativa nem no roteamento do painel (o front acessa `/` sem exigir login) nem na API do backend (nenhuma rota valida autenticação, e o CORS aceita qualquer origem). O painel e a API estão hoje publicamente acessíveis.
* **Envio individual ao aniversariante:** toda mensagem aprovada é enviada ao grupo configurado; o envio direto ao contato específico do aniversariante depende do cadastro do telefone individual.
* **Reforço da trava de duplicidade:** a prevenção atual depende de uma consulta da aplicação antes de criar o registro; uma garantia no nível do banco eliminaria o risco teórico de duplicidade em execuções concorrentes.
* **Feedback visual durante ações de triagem:** os botões de Aprovar, Editar e Reprovar ainda não exibem estado de carregamento enquanto a requisição está em andamento.

## 6. Métricas de Sucesso
* 100% de taxa de acerto nas datas de aniversário (Zero omissões).
* 0% de mensagens duplicadas.
* Redução de 90% do tempo gasto pelo administrador para gerir os aniversários do mês.

* **Limpeza e Estados Vazios da Prévia de Prompt:**
  * **Problema:** A caixa de "Prévia" está exibindo mensagens de teste (hardcoded) ao carregar a tela e ao clicar no botão "Gerar prévia", mesmo quando não há nenhum prompt ativo.
  * **Solução:** Remover todos os textos "chumbados". Se o campo de texto do "Prompt Atual" estiver vazio, a caixa de prévia deve exibir a mensagem *placeholder*: "Nenhum texto disponível para prévia" e o botão "Gerar prévia" deve ficar desabilitado.

* **Geração de Prévia com IA Real (Gemini):**
  * **Problema:** O botão de prévia não está conectado ao motor de geração de texto real.
  * **Solução:** Ao clicar em "Gerar prévia", o sistema deve disparar uma requisição para o Back-end (nunca chamando o Gemini diretamente pelo Front-end). O botão deve entrar em estado de *loading* (desabilitado) durante a chamada. O Back-end deve injetar o dado fictício "Aniversariante de Teste" no`{{nome}}` e consumir a API do Gemini. O retorno deve ser exibido na caixa de prévia, lidando adequadamente com possíveis falhas de rede através de alertas Toast.