import { prisma } from '../lib/prisma';

export async function criarNovaVersaoPrompt(chave: string, conteudo: string, criadoPor: string) {
  return prisma.$transaction(async (tx) => {
    const ultimoPrompt = await tx.prompt.findFirst({
      where: { chave },
      orderBy: { versao: 'desc' },
    });

    const novaVersao = ultimoPrompt ? ultimoPrompt.versao + 1 : 1;

    await tx.prompt.updateMany({
      where: { chave, ativo: true },
      data: { ativo: false },
    });

    return tx.prompt.create({
      data: { chave, versao: novaVersao, conteudo, ativo: true, criadoPor },
    });
  });
}

// Garante que sempre exista um prompt ativo para a chave (usado pelo Scheduler).
// Se nenhuma versão tiver sido criada ainda via API, semeia a versão 1 com o texto padrão.
export async function buscarOuCriarPromptAtivo(chave: string, conteudoPadrao: string) {
  const promptAtivo = await prisma.prompt.findFirst({
    where: { chave, ativo: true },
  });

  if (promptAtivo) return promptAtivo;

  return criarNovaVersaoPrompt(chave, conteudoPadrao, 'sistema');
}
