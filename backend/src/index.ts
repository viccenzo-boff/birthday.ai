import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { iniciarAgendador, verificarEEnviarAniversarios } from './services/scheduler';

console.log('🚀 Iniciando Servidor Birthday.ai...');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }
});

client.on('qr', (qr) => {
    console.log('📱 QR Code gerado:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
    console.log('✅ WhatsApp conectado com sucesso!');
    
    // 1. Dá a partida no despertador que rodará todos os dias às 08:00
    iniciarAgendador(client);

    // 2. DISPARO DE TESTE IMEDIATO (Gatilho Forçado)
    // Vamos rodar a função uma vez logo na inicialização para você ver a mágica 
    // acontecer no seu grupo de testes agora mesmo, sem esperar as 08h00.
    console.log('🧪 Rodando teste de disparo imediato...');
    await verificarEEnviarAniversarios(client);
});

client.initialize();