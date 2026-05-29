import type { Response } from 'express';
import { logger } from './logger';

export function handleRouteError(res: Response, error: unknown, message: string) {
  logger.error(message, error);
  res.status(500).json({ error: message });
}
