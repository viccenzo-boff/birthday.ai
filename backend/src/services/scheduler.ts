import 'dotenv/config';
import cron from 'node-cron';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

// Configuração do Prisma 7 com o Adaptador do Postgres
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// O ID do seu grupo de testes seguro
const GRUPO_ALVO = '554991429722-1635872850@g.us';

// Função principal que faz a checagem no banco de dados
export async function verificarEEnviarAniversarios(whatsappClient: any) {
    console.log('🔍 Executando checagem diária de aniversariantes...');
    
    try {
        const hoje = new Date();
        const diaAtual = hoje.getDate();
        const mesAtual = hoje.getMonth() + 1; // No JS, os meses vão de 0 a 11

        // Busca todos os aniversariantes ativos no banco
        const aniversariantes = await prisma.aniversariante.findMany({
            where: { ativo: true }
        });

        // Filtra os que fazem aniversário hoje (ignorando o ano)
        const aniversariantesDoDia = aniversariantes.filter(p => {
            const dataNasc = new Date(p.data_nascimento);
            // Ajuste simples para ler o dia/mês correto do UTC salvo no seed
            const diaNasc = dataNasc.getUTCDate();
            const mesNasc = dataNasc.getUTCMonth() + 1;
            return diaNasc === diaAtual && mesNasc === mesAtual;
        });

        if (aniversariantesDoDia.length === 0) {
            console.log('✨ Nenhum aniversariante encontrado para o dia de hoje.');
            return;
        }

        console.log(`🎉 Encontrado(s) ${aniversariantesDoDia.length} aniversariante(s) hoje!`);

        // Dispara as mensagens
        for (const pessoa of aniversariantesDoDia) {
            // Usa o apelido se existir, senão usa o nome completo
            const nomeTratado = pessoa.apelido || pessoa.nome;
            
            const mensagem = `🎉 Hoje o dia é de celebração! Parabéns, *${nomeTratado}*! Que Deus abençoe abundantemente a sua vida, com muita saúde, paz e alegria. A comunidade celebra a sua vida hoje! 🎂🎈`;

            // Envia a mensagem diretamente para o grupo de testes
            await whatsappClient.sendMessage(GRUPO_ALVO, mensagem);
            
            // Grava o Log de Sucesso no banco de dados
            await prisma.logEnvio.create({
                data: {
                    status: 'SUCESSO',
                    aniversarianteId: pessoa.id
                }
            });
            
            console.log(`✅ Mensagem enviada com sucesso para ${nomeTratado}`);
            
            // Pequeno atraso manual de 5 segundos entre mensagens se houver mais de um aniversariante
            await new Promise(resolve => setTimeout(resolve, 5000));
        }

    } catch (error: any) {
        console.error('❌ Erro ao processar a rotina de aniversários:', error);
    }
}

// Configuração do Despertador (Cron Job)
export function iniciarAgendador(whatsappClient: any) {
    // Cron padrão: Roda todos os dias às 08:00 da manhã
    // Sintaxe: (Minuto) (Hora) (Dia do Mês) (Mês) (Dia da Semana)
    cron.schedule('0 8 * * *', () => {
        verificarEEnviarAniversarios(whatsappClient);
    }, {
        timezone: "America/Sao_Paulo" // Garante o fuso horário correto de Brasília
    });

    console.log('⏰ Despertador diário programado para às 08:00.');
}