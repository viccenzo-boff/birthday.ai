import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL nao configurada.');
}

// Cria o pool de conexões utilizando a URL da porta 6543 (PgBouncer do Supabase)
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Injeta o motor do Postgres diretamente no Prisma Client
export const prisma = new PrismaClient({ adapter });

// Função para encerrar as conexões graciosamente quando o servidor parar
export async function disconnectPrisma() {
  await prisma.$disconnect();
  await pool.end();
}