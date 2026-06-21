import 'dotenv/config';
import cron from 'node-cron';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Client } from 'whatsapp-web.js';
import { logger } from '../lib/logger';
import { prisma } from '../lib/prisma';
import { buscarOuCriarPromptAtivo } from './prompts';

const CHAVE_PROMPT_ANIVERSARIO = 'GERAR_ANIVERSARIO';

// Usado apenas para semear a versão 1 caso ainda não exista nenhum prompt cadastrado para essa chave.
const PROMPT_PADRAO_ANIVERSARIO = `Escreva uma mensagem de feliz aniversário curta, amigável e respeitosa para {{nome}}.
Instruções obrigatórias:
1. A mensagem será enviada em um grupo de WhatsApp, mas NÃO utilize a palavra "comunidade".
2. Utilize obrigatoriamente linguagem neutra (não utilize adjetivos com marcação de gênero, como "querido", "querida", "nosso" ou "nossa").
3. NÃO utilize emojis de coração em hipótese alguma. Use no máximo 2 emojis neutros (como bolo, confete ou balão).
4. Não use aspas no começo ou no final da resposta.
5. A mensagem deve soar muito natural e humana, desejando felicidades de forma direta e educada.`;

let genAI: GoogleGenerativeAI | null = null;

function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY nao configurada.');
  if (!genAI) genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
}

export async function verificarEEnviarAniversarios(client?: Client) {
  try {
    logger.info('Iniciando varredura de aniversariantes do dia...');
    const hoje = new Date();
    const diaAtual = hoje.getDate();
    const mesAtual = hoje.getMonth() + 1;

    const aniversariantes = await prisma.aniversariante.findMany({
      where: { ativo: true },
    });

    const aniversariantesDoDia = aniversariantes.filter((pessoa) => {
      const dataNasc = new Date(pessoa.data_nascimento);
      const diaNasc = dataNasc.getUTCDate();
      const mesNasc = dataNasc.getUTCMonth() + 1;
      return diaNasc === diaAtual && mesNasc === mesAtual;
    });

    logger.info(`Foram encontrados ${aniversariantesDoDia.length} aniversariante(s) para hoje.`);

    if (aniversariantesDoDia.length === 0) return;

    const promptAtivo = await buscarOuCriarPromptAtivo(
      CHAVE_PROMPT_ANIVERSARIO,
      PROMPT_PADRAO_ANIVERSARIO
    );

    const model = getGeminiModel();
    let novasMensagens = 0;

    for (const pessoa of aniversariantesDoDia) {
      const inicioDoDia = new Date();
      inicioDoDia.setHours(0, 0, 0, 0);
      const fimDoDia = new Date();
      fimDoDia.setHours(23, 59, 59, 999);

      const logJaExiste = await prisma.logEnvio.findFirst({
        where: {
          aniversarianteId: pessoa.id,
          dataCriacao: { gte: inicioDoDia, lte: fimDoDia },
        },
      });

      if (logJaExiste) {
        logger.info(`[TRAVA] Mensagem já existe hoje para ID ${pessoa.id}. Pulando.`);
        continue;
      }

      logger.info(`Gerando mensagem para o ID ${pessoa.id}...`);
      const nomeFinal = pessoa.apelido || pessoa.nome;
      const prompt = promptAtivo.conteudo.replace(/\{\{nome\}\}/g, nomeFinal);

      const result = await model.generateContent(prompt);
      await prisma.logEnvio.create({
        data: {
          aniversarianteId: pessoa.id,
          promptId: promptAtivo.id,
          mensagemOriginal: result.response.text(),
          status: 'PENDENTE',
        },
      });

      novasMensagens++;
      logger.info(`Mensagem gerada e salva com sucesso para ID ${pessoa.id}.`);
    }

    if (novasMensagens > 0 && client) {
      const adminPhone = process.env.WHATSAPP_ADMIN_PHONE;
      if (adminPhone) {
        const msgAviso = `🚨 *Birthday.ai* 🚨\nVocê tem ${novasMensagens} nova(s) mensagem(ns) de aniversário pendente(s) para aprovar!\n\nAcesse o painel: https://birthday-ai-three.vercel.app`;
        await client.sendMessage(adminPhone, msgAviso);
        logger.info('Notificação enviada ao administrador.');
      }
    }
  } catch (error) {
    logger.error('Erro ao gerar mensagens com IA', error);
  }
}

export function iniciarAgendador(client: Client) {
  // Executa a cada 5 minutos, começando às 08:00 até as 23:59
  cron.schedule(
    '*/5 8-23 * * *',
    () => {
      void verificarEEnviarAniversarios(client);
    },
    {
      timezone: 'America/Sao_Paulo',
    }
  );

  logger.info('Agendador programado para rodar a cada 5 min (das 08:00 às 23:59).');
}