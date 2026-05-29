import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createMessagesRouter } from './routes/messages';
import { iniciarAgendador, verificarEEnviarAniversarios } from './services/scheduler';
import { createWhatsAppClient } from './services/whatsapp';
import { logger } from './lib/logger';

const app = express();
const client = createWhatsAppClient();
const port = Number(process.env.PORT ?? 3333);
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000';

logger.info('Iniciando Servidor Birthday.ai...');

app.use(cors({ origin: frontendOrigin }));
app.use(express.json());
app.use('/api/mensagens', createMessagesRouter(client));

app.listen(port, () => {
  logger.info(`Servidor da API rodando na porta ${port}`);
});

client.on('ready', () => {
  logger.info('WhatsApp conectado com sucesso.');
  iniciarAgendador();
  void verificarEEnviarAniversarios();
});

void client.initialize().catch((error: unknown) => {
  logger.error('Erro ao inicializar WhatsApp', error);
});
