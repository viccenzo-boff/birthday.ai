import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createMessagesRouter } from './routes/messages';
import { iniciarAgendador, verificarEEnviarAniversarios } from './services/scheduler';
import { createWhatsAppClient } from './services/whatsapp';
import { logger } from './lib/logger';
import { promptsRouter } from './routes/prompts';

const app = express();
const client = createWhatsAppClient();
const port = Number(process.env.PORT ?? 3333);

logger.info('Iniciando Servidor Birthday.ai...');

// Configuração atualizada do CORS para permitir o Ngrok e a Vercel
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning']
}));

app.use(express.json());
app.use('/api/mensagens', createMessagesRouter(client));
app.use('/api/prompts', promptsRouter);

app.listen(port, () => {
  logger.info(`Servidor da API rodando na porta ${port}`);
});

client.on('ready', () => {
  logger.info('WhatsApp conectado com sucesso.');
  iniciarAgendador(client);
  void verificarEEnviarAniversarios(client);
});

void client.initialize().catch((error: unknown) => {
  logger.error('Erro ao inicializar WhatsApp', error);
});