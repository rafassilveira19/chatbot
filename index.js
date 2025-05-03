const { 
  default: makeWASocket, 
  useMultiFileAuthState, 
  DisconnectReason 
} = require('baileys');
const path = require('path');
const qrcode = require('qrcode'); // Para gerar o QR Code no terminal

let isReconnecting = false;
const usuariosEmAtendimento = new Map();

async function createWhatsAppClient(instanceId = 'default') {
  const storePath = path.join(__dirname, `auth_info_${instanceId}`);
  const { state, saveCreds } = await useMultiFileAuthState(storePath);

  const client = makeWASocket({
    auth: state,
    printQRInTerminal: false, // Desabilita a impressão automática do QR no terminal
  });

  client.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (connection === 'close') {
      const shouldReconnect = 
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

      if (shouldReconnect && !isReconnecting) {
        isReconnecting = true;
        console.log(`🔄 Reconectando ${instanceId}...`);
        setTimeout(() => {
          createWhatsAppClient(instanceId);
          isReconnecting = false;
        }, 2000);
      } else {
        console.log(`⚠️ Usuário deslogado da ${instanceId}. Escaneie o QR Code.`);
      }
    } else if (connection === 'open') {
      console.log(`✅ Wpp ${instanceId} conectado com sucesso!`);
    }

    // Verificando se há QR Code para exibir
    if (qr) {
      console.log('Escaneie o QR Code para autenticação:');
      qrcode.toString(qr, { type: 'terminal' }, (err, url) => {
        if (err) {
          console.error('Erro ao gerar o QR Code:', err);
          return;
        }
        console.log(url); // Exibe o QR Code no terminal
      });
    }
  });

  client.ev.on('creds.update', saveCreds);

  client.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;

    let texto = '';
    if (msg.message?.conversation) {
      texto = msg.message.conversation;
    } else if (msg.message?.extendedTextMessage?.text) {
      texto = msg.message.extendedTextMessage.text;
    } else if (msg.message?.imageMessage?.caption) {
      texto = msg.message.imageMessage.caption;
    } else if (msg.message?.videoMessage?.caption) {
      texto = msg.message.videoMessage.caption;
    }

    const textoLimpo = texto.trim().toLowerCase();
    const agora = Date.now();
    const usuario = usuariosEmAtendimento.get(from) || { ativo: false, ultimoContato: 0 };

    const tempoInativo = agora - usuario.ultimoContato > 30 * 60 * 1000;
    usuario.ultimoContato = agora;

    if (textoLimpo === 'menu' && !usuario.ativo) {
      usuario.ativo = true;
      usuariosEmAtendimento.set(from, usuario);

      const horaAtual = new Date().getHours();
      let opcaoFalarCom = "Falar com a Dani 💬";

      if (horaAtual >= 16 && horaAtual <= 19) {
        opcaoFalarCom = "Falar com a Brielle 💬";
      }

      await client.sendMessage(from, {
        text: `Olá! Seja bem-vindo(a) à Kantine 😊

Nos diga o que precisa selecionando um dos números abaixo:

*1*  – Encomendas de Bolos 🍰  
*2*  – Pedidos Delivery ou Retirada 🛵  
*3*  – Encomendas de Outros Produtos 🥐  
*4*  – ${opcaoFalarCom}  
*5*  – Horários de Atendimento 🕒`
      });

      return;
    }

    if (tempoInativo && !usuario.ativo) {
      usuario.ativo = true;
      usuariosEmAtendimento.set(from, usuario);

      const horaAtual = new Date().getHours();
      let opcaoFalarCom = "Falar com a Dani 💬";

      if (horaAtual >= 16 && horaAtual <= 19) {
        opcaoFalarCom = "Falar com a Brielle 💬";
      }

      await client.sendMessage(from, {
        text: `Olá! Seja bem-vindo(a) à Kantine 😊

Nos diga o que precisa selecionando um dos números abaixo:

*1*  – Encomendas de Bolos 🍰  
*2*  – Pedidos Delivery ou Retirada 🛵  
*3*  – Encomendas de Outros Produtos 🥐  
*4*  – ${opcaoFalarCom}  
*5*  – Horários de Atendimento 🕒`
      });

      return;
    }

    if (usuario.ativo) {
      switch (textoLimpo) {
        case '1':
          await client.sendMessage(from, {
            text: `Dê uma olhadinha em nosso cardápio: https://drive.google.com/file/d/1YVXaOwr9mdlE0FZJWbgXUjPhWC51tnGw

*Me diga qual bolo, tamanho, data e horário de retirada que já já eu pego seu pedido!* 😉

📦 Encomendas devem ser feitas com 48h de antecedência — se for de última hora, a gente vê com a cozinha se consegue te atender!

Pra voltar as opções do menu, digite "MENU".`
          });
          usuario.ativo = false; 
          usuariosEmAtendimento.set(from, usuario);
          return;

        case '2':
          await client.sendMessage(from, {
            text: `Para facilitar o seu pedido de *delivery*, acesse: https://pedido.takeat.app/kantinegastronomia

Caso queira fazer um pedido pra retiradas, é só selecionar a opção de *retirada* no site.

Pra voltar as opções do menu, digite "MENU".`
          });
          usuario.ativo = false;
          usuariosEmAtendimento.set(from, usuario);
          return;

        case '3':
          await client.sendMessage(from, {
            text: `Me diga qual produto você gostaria, a data de retirada e a quantidade.

Pra voltar as opções do menu, digite "MENU".`
          });
          usuario.ativo = false;
          usuariosEmAtendimento.set(from, usuario);
          return;

        case '4':
          await client.sendMessage(from, {
            text: `Beleza! Já já te respondo!

Pra voltar as opções do menu, digite "MENU".`
          });
          usuario.ativo = false;
          usuariosEmAtendimento.set(from, usuario);
          return;

        case '5':
          await client.sendMessage(from, {
            text: `🕒 *Horários de Atendimento*

📍 *Loja (Vinhedos e Getúlio)*  
• Seg: 12h – 19h  
• Ter a Sex: 09h – 19h  
• Sáb: 09h – 18h

📱 *WhatsApp e Delivery*  
• Seg: 12h – 19h  
• Ter a Sex: 10h – 18h  
• Sáb: 10h – 17h30

Pra voltar as opções do menu, digite "MENU".`
          });
          usuario.ativo = false;
          usuariosEmAtendimento.set(from, usuario);
          return;

        default:
          await client.sendMessage(from, {
            text: "Por favor, selecione uma das opções do menu!"
          });
          return;
      }
    }
  });

  client.ev.on('creds.update', saveCreds);
}

createWhatsAppClient('kantine');
