import 'dotenv/config';
import cron from 'node-cron';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../lib/logger';
import { prisma } from '../lib/prisma';

let genAI: GoogleGenerativeAI | null = null;

function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY nao configurada.');
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(apiKey);
  }

  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
}

export async function verificarEEnviarAniversarios() {
  try {
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

    if (aniversariantesDoDia.length === 0) {
      return;
    }

    const model = getGeminiModel();

    for (const pessoa of aniversariantesDoDia) {
      const nomeFinal = pessoa.apelido || pessoa.nome;
      const prompt = `Escreva uma mensagem de feliz aniversário curta, amigável e respeitosa para ${nomeFinal}. 
            
Instruções obrigatórias:
1. A mensagem será enviada em um grupo de WhatsApp, mas NÃO utilize a palavra "comunidade".
2. Utilize obrigatoriamente linguagem neutra (não utilize adjetivos com marcação de gênero, como "querido", "querida", "nosso" ou "nossa").
3. NÃO utilize emojis de coração em hipótese alguma. Use no máximo 2 emojis neutros (como bolo, confete ou balão).
4. Não use aspas no começo ou no final da resposta.
5. A mensagem deve soar muito natural e humana, desejando felicidades de forma direta e educada.`;

      const result = await model.generateContent(prompt);
      const mensagemGerada = result.response.text();

      await prisma.logEnvio.create({
        data: {
          aniversarianteId: pessoa.id,
          mensagemOriginal: mensagemGerada,
          status: 'PENDENTE',
        },
      });
    }
  } catch (error) {
    logger.error('Erro ao gerar mensagens com IA', error);
  }
}

export function iniciarAgendador() {
  cron.schedule(
    '0 8 * * *',
    () => {
      void verificarEEnviarAniversarios();
    },
    {
      timezone: 'America/Sao_Paulo',
    }
  );

  logger.info('Agendador diário programado para 08:00.');
}
