import type { Response } from 'express';
import { Prisma } from '@prisma/client';
import { logger } from './logger';

export function handleRouteError(res: Response, error: unknown, message: string) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'Já existe um registro com esses dados.' });
      return;
    }

    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Registro não encontrado.' });
      return;
    }
  }

  logger.error(message, error);
  res.status(500).json({ error: message });
}
