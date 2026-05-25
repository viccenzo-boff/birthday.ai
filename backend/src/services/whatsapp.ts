import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';

console.log('🤖 Inicializando o motor do WhatsApp...');

// Configuração do cliente simulando o navegador
const client = new Client({
    authStrategy: new LocalAuth(), // Salva a sessão na pasta do projeto
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'], // Evita travamentos comuns
    }
});

// Evento: Quando o sistema precisar de autenticação, gera o QR Code no terminal
client.on('qr', (qr) => {
    console.log('📱 Escaneie o QR Code abaixo com o seu WhatsApp (Aparelhos Conectados):');
    qrcode.generate(qr, { small: true });
});

// Evento: Quando a conexão for estabelecida com sucesso
client.on('ready', () => {
    console.log('✅ Conexão estabelecida! O motor do WhatsApp está pronto e operando.');
});

// Evento de Teste: Escuta as mensagens que você mesmo envia
client.on('message_create', async (message) => {
    // Comando 1: Teste de vida
    if (message.body === '!teste') {
        message.reply('🤖 Sistema online! O seu assistente está vivo.');
    }

    // Comando 2: Descobrir o ID do Grupo (Comando Secreto)
    if (message.body === '!id') {
        const chat = await message.getChat();
        
        if (chat.isGroup) {
            console.log(`\n🎯 ID DO GRUPO ENCONTRADO: ${chat.id._serialized}\n`);
            message.reply(`O ID secreto deste grupo é: ${chat.id._serialized}`);
        } else {
            message.reply('Este comando só funciona dentro de grupos!');
        }
    }
});

client.initialize();