import { disconnectPrisma, prisma } from '../src/lib/prisma';
import { logger } from '../src/lib/logger';

interface SeedContact {
  nome: string;
  apelido: string;
  dia: number;
  mes: number;
}

async function main() {
  const contatos: SeedContact[] = [
    { nome: "Lauri Marini", apelido: "Lauri", dia: 1, mes: 1 },
    { nome: "Arthur Zaminan", apelido: "Arthur", dia: 5, mes: 1 },
    { nome: "Émerson Vieira", apelido: "Émerson", dia: 7, mes: 1 },
    { nome: "Anderson Vieira", apelido: "Anderson", dia: 7, mes: 1 },
    { nome: "Sara Zeni", apelido: "Sara", dia: 12, mes: 1 },
    { nome: "Cassiane Pansera", apelido: "Cassiane", dia: 13, mes: 1 },
    { nome: "Alcione N. M. Pedan", apelido: "Alcione", dia: 15, mes: 1 },
    { nome: "Adelino Santos Macedo", apelido: "Adelino", dia: 15, mes: 1 },
    { nome: "Isadora N. M. Ramos", apelido: "Isadora", dia: 15, mes: 1 },
    { nome: "Helena Thomas", apelido: "Helena", dia: 17, mes: 1 },
    { nome: "Carloy Eduardo Quijada Vargas", apelido: "Carloy", dia: 18, mes: 1 },
    { nome: "Lêonidas Ramos", apelido: "Lêonidas", dia: 20, mes: 1 },
    { nome: "Daiana Henrique", apelido: "Daiana", dia: 22, mes: 1 },
    { nome: "Karen Floss", apelido: "Karen", dia: 28, mes: 1 },
    { nome: "Pedro Henrique Michatowski", apelido: "Pedro", dia: 2, mes: 2 },
    { nome: "Ester Gubiani", apelido: "Ester", dia: 2, mes: 2 },
    { nome: "Maria Carmem Bender", apelido: "Maria Carmem", dia: 3, mes: 2 },
    { nome: "Toni Schneider", apelido: "Toni", dia: 12, mes: 2 },
    { nome: "Liliana Wrzesinki", apelido: "Liliana", dia: 13, mes: 2 },
    { nome: "Sara Alves", apelido: "Sara", dia: 18, mes: 2 },
    { nome: "Estela Gubiani", apelido: "Estela", dia: 23, mes: 2 },
    { nome: "José (filho Natieli)", apelido: "José", dia: 23, mes: 2 },
    { nome: "Rachel Beskow Zeni", apelido: "Rachel", dia: 25, mes: 2 },
    { nome: "Jaquelina Velasque", apelido: "Jaquelina", dia: 26, mes: 2 },
    { nome: "Giovana Merlo", apelido: "Giovana", dia: 5, mes: 3 },
    { nome: "Anderson Zamboni", apelido: "Anderson", dia: 12, mes: 3 },
    { nome: "Davi Michatowski", apelido: "Davi", dia: 15, mes: 3 },
    { nome: "Bernardo N. M. Pedan", apelido: "Bernardo", dia: 16, mes: 3 },
    { nome: "Rita Velasque", apelido: "Rita", dia: 16, mes: 3 },
    { nome: "Marcio Cella", apelido: "Marcio", dia: 17, mes: 3 },
    { nome: "Davi Thomas", apelido: "Davi", dia: 18, mes: 3 },
    { nome: "Cecília kavalerski", apelido: "Cecília", dia: 19, mes: 3 },
    { nome: "Luciane Pansera", apelido: "Luciane", dia: 22, mes: 3 },
    { nome: "Cleder Pedan", apelido: "Cleder", dia: 23, mes: 3 },
    { nome: "João Vitor (Daiana)", apelido: "João Vitor", dia: 23, mes: 3 },
    { nome: "Carloy Eduardo (Filho)", apelido: "Carloy", dia: 30, mes: 3 },
    { nome: "Dineia", apelido: "Dineia", dia: 3, mes: 4 },
    { nome: "Yasmin (Adilson e Adriana)", apelido: "Yasmin", dia: 5, mes: 4 },
    { nome: "Pedro (pai da Elizangela)", apelido: "Pedro", dia: 7, mes: 4 },
    { nome: "Hellyn Crystina Ratkiewicz Vieira", apelido: "Hellyn", dia: 11, mes: 4 },
    { nome: "Giuseppe Marcon", apelido: "Giuseppe", dia: 11, mes: 4 },
    { nome: "Adilson Reolon", apelido: "Adilson", dia: 12, mes: 4 },
    { nome: "João Pedro Zeni", apelido: "João Pedro", dia: 12, mes: 4 },
    { nome: "Gabriela Cella", apelido: "Gabriela", dia: 13, mes: 4 },
    { nome: "Rodrigo Marcon", apelido: "Rodrigo", dia: 19, mes: 4 },
    { nome: "Sara Soares (filha João Soares)", apelido: "Sara", dia: 27, mes: 4 },
    { nome: "Evaldo", apelido: "Evaldo", dia: 2, mes: 5 },
    { nome: "Tirza N. M. Pedan", apelido: "Tirza", dia: 5, mes: 5 },
    { nome: "Luara M. Pedan", apelido: "Luara", dia: 7, mes: 5 },
    { nome: "Melyna Antonilla Marchi", apelido: "Melyna", dia: 10, mes: 5 },
    { nome: "Márcio Stein", apelido: "Márcio", dia: 11, mes: 5 },
    { nome: "Alice (Fabiano e Karen)", apelido: "Alice", dia: 11, mes: 5 },
    { nome: "Lívia (Fabiano e Karen)", apelido: "Lívia", dia: 11, mes: 5 },
    { nome: "Lucia Marcon", apelido: "Lucia", dia: 13, mes: 5 },
    { nome: "Luiza Merlo", apelido: "Luiza", dia: 17, mes: 5 },
    { nome: "Gentil Velasque", apelido: "Gentil", dia: 21, mes: 5 },
    { nome: "Tânia Merlo", apelido: "Tânia", dia: 22, mes: 5 },
    { nome: "Iara Stein", apelido: "Iara", dia: 25, mes: 5 },
    { nome: "Ivan Ramos", apelido: "Ivan", dia: 25, mes: 5 },
    { nome: "Chailon Pedro Michatowski", apelido: "Chailon", dia: 1, mes: 6 },
    { nome: "Elcia Alves", apelido: "Elcia", dia: 3, mes: 6 },
    { nome: "Eliézer A. N. Macedo", apelido: "Eliézer", dia: 5, mes: 6 },
    { nome: "Jehann Marchi", apelido: "Jehann", dia: 5, mes: 6 },
    { nome: "Adriano Thomas", apelido: "Adriano", dia: 10, mes: 6 },
    { nome: "Emilly (filha Toni)", apelido: "Emilly", dia: 12, mes: 6 },
    { nome: "Gabriela Thomas", apelido: "Gabriela", dia: 13, mes: 6 },
    { nome: "Artur N. M. Ramos", apelido: "Artur", dia: 17, mes: 6 },
    { nome: "Isabella (filha Evaldo e Giolane)", apelido: "Isabella", dia: 17, mes: 6 },
    { nome: "Hadassah P. Macedo", apelido: "Hadassah", dia: 24, mes: 6 },
    { nome: "Julia (filha Nati e Luan)", apelido: "Julia", dia: 24, mes: 6 },
    { nome: "Isadora Velasque", apelido: "Isadora", dia: 30, mes: 6 },
    { nome: "Romilda", apelido: "Romilda", dia: 6, mes: 7 },
    { nome: "Adriana (Adilson)", apelido: "Adriana", dia: 8, mes: 7 },
    { nome: "Heron", apelido: "Heron", dia: 8, mes: 7 },
    { nome: "João Valdir Soares (parente Leandrina/Pedro)", apelido: "João Valdir", dia: 22, mes: 7 },
    { nome: "Luan (marido Nati)", apelido: "Luan", dia: 23, mes: 7 },
    { nome: "Rebeca Macedo", apelido: "Rebeca", dia: 25, mes: 7 },
    { nome: "Marli (Pinhalzinho)", apelido: "Marli", dia: 26, mes: 7 },
    { nome: "Joner Merlo", apelido: "Joner", dia: 28, mes: 7 },
    { nome: "Stefano", apelido: "Stefano", dia: 29, mes: 7 },
    { nome: "João da Silva (esposo Rosalina)", apelido: "João", dia: 31, mes: 7 },
    { nome: "Valdecir Gubiani", apelido: "Valdecir", dia: 2, mes: 8 },
    { nome: "Nader Merlo", apelido: "Nader", dia: 11, mes: 8 },
    { nome: "Isabela (Daiana e Anderson)", apelido: "Isabela", dia: 14, mes: 8 },
    { nome: "Leandrina", apelido: "Leandrina", dia: 14, mes: 8 },
    { nome: "Rogéria Dayana Ratkiewicz Cella", apelido: "Rogéria", dia: 17, mes: 8 },
    { nome: "Marco Antônio (Jehann e Eli)", apelido: "Marco Antônio", dia: 20, mes: 8 },
    { nome: "Benjamin P. Macedo", apelido: "Benjamin", dia: 21, mes: 8 },
    { nome: "Solange Thomas", apelido: "Solange", dia: 25, mes: 8 },
    { nome: "Sr. Raul", apelido: "Sr. Raul", dia: 31, mes: 8 },
    { nome: "Ingrid N. M. Ramos", apelido: "Ingrid", dia: 4, mes: 9 },
    { nome: "Sara (neta dona Rosalina)", apelido: "Sara", dia: 10, mes: 9 },
    { nome: "Lucas Cella", apelido: "Lucas", dia: 13, mes: 9 },
    { nome: "Marcos Rosa (filho Sr. Raul)", apelido: "Marcos", dia: 19, mes: 9 },
    { nome: "Daiane Bender Thomas", apelido: "Daiane", dia: 20, mes: 9 },
    { nome: "Selvino Finatto", apelido: "Selvino", dia: 21, mes: 9 },
    { nome: "Kaleb N. M. Pedan", apelido: "Kaleb", dia: 23, mes: 9 },
    { nome: "Marli Merlo", apelido: "Marli", dia: 27, mes: 9 },
    { nome: "Julio (neto dona Rosalina)", apelido: "Julio", dia: 27, mes: 9 },
    { nome: "Elizangela Marchi", apelido: "Elizangela", dia: 28, mes: 9 },
    { nome: "Escarleth (filha Carloy)", apelido: "Escarleth", dia: 2, mes: 10 },
    { nome: "Hilário", apelido: "Hilário", dia: 5, mes: 10 },
    { nome: "Giolane (esposa Evaldo)", apelido: "Giolane", dia: 6, mes: 10 },
    { nome: "Keyla", apelido: "Keyla", dia: 6, mes: 10 },
    { nome: "Moacir Alves", apelido: "Moacir", dia: 15, mes: 10 },
    { nome: "Beatriz Finatto", apelido: "Beatriz", dia: 17, mes: 10 },
    { nome: "Noah", apelido: "Noah", dia: 23, mes: 10 },
    { nome: "Rosalina Zanini", apelido: "Rosalina", dia: 26, mes: 10 },
    { nome: "Lileybis (esposa Carloy)", apelido: "Lileybis", dia: 27, mes: 10 },
    { nome: "Natieli", apelido: "Natieli", dia: 3, mes: 11 },
    { nome: "Samuel Cella", apelido: "Samuel", dia: 11, mes: 11 },
    { nome: "Suelin Michatowski", apelido: "Suelin", dia: 20, mes: 11 },
    { nome: "Cecília (Anderson e Daiana)", apelido: "Cecília", dia: 22, mes: 11 },
    { nome: "João ( Fabiano e Karen)", apelido: "João", dia: 28, mes: 11 },
    { nome: "Laura Pansera", apelido: "Laura", dia: 3, mes: 12 },
    { nome: "Ely Nagib Macedo", apelido: "Ely", dia: 4, mes: 12 },
    { nome: "Lucas Merlo", apelido: "Lucas", dia: 12, mes: 12 },
    { nome: "Elizana Gubiani", apelido: "Elizana", dia: 16, mes: 12 },
    { nome: "Rosani Loureiro de Mello", apelido: "Rosani", dia: 17, mes: 12 },
    { nome: "Cassiano Pansera", apelido: "Cassiano", dia: 18, mes: 12 },
    { nome: "Andrey (filho Giovani)", apelido: "Andrey", dia: 20, mes: 12 },
    { nome: "Fabiano Furlaneto", apelido: "Fabiano", dia: 27, mes: 12 }
  ];

  for (const item of contatos) {
    // Usamos o UTC e o meio-dia (12:00) para garantir que problemas de fuso horário 
    // nunca empurrem a data para o dia anterior no banco. O ano 2000 é usado apenas 
    // como preenchimento obrigatório para suportar dias 29 de fevereiro.
    const dataNascimento = new Date(Date.UTC(2000, item.mes - 1, item.dia, 12, 0, 0));

    await prisma.aniversariante.create({
      data: {
        nome: item.nome,
        apelido: item.apelido,
        data_nascimento: dataNascimento,
      },
    });
  }

  logger.info(`Banco de dados populado com sucesso com ${contatos.length} aniversariantes.`);
}

main()
  .catch((error) => {
    logger.error('Erro ao executar seed', error);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectPrisma();
  });
