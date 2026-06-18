/*
  Warnings:

  - You are about to drop the column `data_envio` on the `LogEnvio` table. All the data in the column will be lost.
  - You are about to drop the column `detalhe_erro` on the `LogEnvio` table. All the data in the column will be lost.
  - Added the required column `dataAtualizacao` to the `LogEnvio` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mensagemOriginal` to the `LogEnvio` table without a default value. This is not possible if the table is not empty.
  - Added the required column `promptId` to the `LogEnvio` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "LogEnvio" DROP CONSTRAINT "LogEnvio_aniversarianteId_fkey";

-- AlterTable
ALTER TABLE "LogEnvio" DROP COLUMN "data_envio",
DROP COLUMN "detalhe_erro",
ADD COLUMN     "dataAtualizacao" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "mensagemEditada" TEXT,
ADD COLUMN     "mensagemOriginal" TEXT NOT NULL,
ADD COLUMN     "promptId" TEXT NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PENDENTE';

-- CreateTable
CREATE TABLE "Prompt" (
    "id" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "versao" INTEGER NOT NULL,
    "conteudo" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT false,
    "criadoPor" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prompt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Prompt_chave_versao_key" ON "Prompt"("chave", "versao");

-- AddForeignKey
ALTER TABLE "LogEnvio" ADD CONSTRAINT "LogEnvio_aniversarianteId_fkey" FOREIGN KEY ("aniversarianteId") REFERENCES "Aniversariante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogEnvio" ADD CONSTRAINT "LogEnvio_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
