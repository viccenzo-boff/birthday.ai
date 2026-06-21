import { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { handleRouteError } from '../lib/http';
import { criarNovaVersaoPrompt } from '../services/prompts';

interface PromptParams {
  chave: string;
}

interface CreatePromptBody {
  chave?: string;
  conteudo?: string;
  criadoPor?: string;
}

export const promptsRouter = Router();

// 1. Endpoint para buscar o prompt que está ativo no momento (O Scheduler vai usar isso)
promptsRouter.get('/ativo/:chave', async (req: Request<PromptParams>, res: Response) => {
  try {
    const { chave } = req.params;

    const promptAtivo = await prisma.prompt.findFirst({
      where: {
        chave: chave,
        ativo: true,
      },
    });

    if (!promptAtivo) {
      res.status(404).json({ error: 'Nenhum prompt ativo encontrado para esta chave.' });
      return;
    }

    res.json(promptAtivo);
  } catch (error) {
    handleRouteError(res, error, 'Erro ao buscar prompt ativo');
  }
});

// 2. Endpoint para listar todos os prompts (Para mostrar o histórico no Front-end)
promptsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const prompts = await prisma.prompt.findMany({
      orderBy: [{ chave: 'asc' }, { versao: 'desc' }],
    });
    
    res.json(prompts);
  } catch (error) {
    handleRouteError(res, error, 'Erro ao listar histórico de prompts');
  }
});

// 3. Endpoint para criar uma nova versão do prompt e torná-la a ativa
promptsRouter.post('/', async (req: Request<unknown, unknown, CreatePromptBody>, res: Response) => {
  try {
    const { chave, conteudo, criadoPor } = req.body;

    if (
      typeof chave !== 'string' ||
      typeof conteudo !== 'string' ||
      typeof criadoPor !== 'string' ||
      !chave.trim() ||
      !conteudo.trim() ||
      !criadoPor.trim()
    ) {
      res.status(400).json({ error: 'Os campos chave, conteudo e criadoPor são obrigatórios.' });
      return;
    }

    const novoPrompt = await criarNovaVersaoPrompt(
      chave.trim(),
      conteudo.trim(),
      criadoPor.trim()
    );

    res.status(201).json(novoPrompt);
  } catch (error) {
    handleRouteError(res, error, 'Erro ao criar novo prompt');
  }
});