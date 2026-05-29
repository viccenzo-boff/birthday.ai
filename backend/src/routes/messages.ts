import { Router } from 'express';
import type { Request, Response } from 'express';
import type { Client } from 'whatsapp-web.js';
import { handleRouteError } from '../lib/http';
import { prisma } from '../lib/prisma';

const TARGET_GROUP_ID = '554991429722-1635872850@g.us';

interface MessageParams {
  id: string;
}

interface EditMessageBody {
  novoTexto?: string;
}

export function createMessagesRouter(client: Client) {
  const router = Router();

  router.get('/', async (_req: Request, res: Response) => {
    try {
      const mensagens = await prisma.logEnvio.findMany({
        include: { aniversariante: true },
        orderBy: { dataCriacao: 'desc' },
      });

      res.json(mensagens);
    } catch (error) {
      handleRouteError(res, error, 'Erro ao buscar mensagens');
    }
  });

  router.post('/:id/aprovar', async (req: Request<MessageParams>, res: Response) => {
    try {
      const { id } = req.params;
      const log = await prisma.logEnvio.findUnique({ where: { id } });

      if (!log) {
        res.status(404).json({ error: 'Mensagem não encontrada' });
        return;
      }

      const textoFinal = log.mensagemEditada || log.mensagemOriginal;
      const statusFinal = log.mensagemEditada ? 'EDITADO_E_ENVIADO' : 'ENVIADO';

      await client.sendMessage(TARGET_GROUP_ID, textoFinal);

      await prisma.logEnvio.update({
        where: { id },
        data: { status: statusFinal },
      });

      res.json({ sucesso: true, mensagem: 'Enviado com sucesso!' });
    } catch (error) {
      handleRouteError(res, error, 'Erro ao aprovar e enviar');
    }
  });

  router.post('/:id/reprovar', async (req: Request<MessageParams>, res: Response) => {
    try {
      const { id } = req.params;

      await prisma.logEnvio.update({
        where: { id },
        data: { status: 'REPROVADO' },
      });

      res.json({ sucesso: true });
    } catch (error) {
      handleRouteError(res, error, 'Erro ao reprovar');
    }
  });

  router.post(
    '/:id/editar',
    async (req: Request<MessageParams, unknown, EditMessageBody>, res: Response) => {
      try {
        const { id } = req.params;
        const { novoTexto } = req.body;

        if (typeof novoTexto !== 'string') {
          res.status(400).json({ error: 'Texto da mensagem é obrigatório' });
          return;
        }

        await prisma.logEnvio.update({
          where: { id },
          data: { mensagemEditada: novoTexto },
        });

        res.json({ sucesso: true });
      } catch (error) {
        handleRouteError(res, error, 'Erro ao editar');
      }
    }
  );

  return router;
}
