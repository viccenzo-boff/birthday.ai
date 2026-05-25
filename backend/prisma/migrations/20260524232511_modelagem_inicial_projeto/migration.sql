-- CreateTable
CREATE TABLE "Aniversariante" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "apelido" TEXT,
    "data_nascimento" TIMESTAMP(3) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Aniversariante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogEnvio" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "detalhe_erro" TEXT,
    "data_envio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aniversarianteId" TEXT NOT NULL,

    CONSTRAINT "LogEnvio_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LogEnvio" ADD CONSTRAINT "LogEnvio_aniversarianteId_fkey" FOREIGN KEY ("aniversarianteId") REFERENCES "Aniversariante"("id") ON DELETE CASCADE ON UPDATE CASCADE;
