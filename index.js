const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require('baileys');
const path = require('path');
const qrcode = require('qrcode');

let isReconnecting = false;
const usuariosEmAtendimento = new Map();

function estaDentroDoHorarioDeAtendimento() {
  const agora = new Date();
  const dia = agora.getDay(); 
  const hora = agora.getHours();
  const minutos = agora.getMinutes();
  const horarioAtual = hora * 60 + minutos;

  if (dia === 1) return horarioAtual >= 12 * 60 && horarioAtual < 19 * 60;
  if (dia >= 2 && dia <= 5) return horarioAtual >= 10 * 60 && horarioAtual < 17 * 60;
  if (dia === 6) return horarioAtual >= 10 * 60 && horarioAtual < 17 * 60 + 30;

  return false; 
} 


async function createWhatsAppClient(instanceId = 'default') {
  const storePath = path.join(__dirname, `auth_info_${instanceId}`);
  const { state, saveCreds } = await useMultiFileAuthState(storePath);

  const client = makeWASocket({
    auth: state,
    printQRInTerminal: false,
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

    if (qr) {
      console.log('Escaneie o QR Code para autenticação:');
      qrcode.toString(qr, { type: 'terminal' }, (err, url) => {
        if (err) return console.error('Erro ao gerar o QR Code:', err);
        console.log(url);
      });
    }
  });

  client.ev.on('creds.update', saveCreds);

  client.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;

    let texto = '';
    if (msg.message?.conversation) texto = msg.message.conversation;
    else if (msg.message?.extendedTextMessage?.text) texto = msg.message.extendedTextMessage.text;
    else if (msg.message?.imageMessage?.caption) texto = msg.message.imageMessage.caption;
    else if (msg.message?.videoMessage?.caption) texto = msg.message.videoMessage.caption;

    const textoLimpo = texto.trim().toLowerCase();
    const agora = Date.now();
    const usuario = usuariosEmAtendimento.get(from) || { ativo: false, ultimoContato: 0, tentativasInvalidas: 0 };
    const tempoInativo = agora - usuario.ultimoContato > 30 * 60 * 1000;

    usuario.ultimoContato = agora;

    if (!estaDentroDoHorarioDeAtendimento() && !usuario.ativo) {
      usuario.ativo = true;
      usuario.tentativasInvalidas = 0;
      usuariosEmAtendimento.set(from, usuario);

      return await client.sendMessage(from, {
        text: `Olá! Seja bem-vindo(a) à Kantine 😊\n\nNo momento não estamos disponíveis.\n\n🕒 *Nossos horários de atendimento são:*\n\n• Seg: 12h – 19h\n• Ter a Sex: 10h – 18h\n• Sáb: 10h – 17h30\n\nMas deixe sua mensagem, que assim que alguém estiver disponível, te atendemos! 😊\n\nNos diga o que precisa selecionando um dos números abaixo:\n\n*1*  – Encomendas de Bolos 🍰\n*2*  – Pedidos Delivery ou Retirada 🛵\n*3*  – Encomendas de Outros Produtos 🥐\n\n Assim que alguém tiver disponível, daremos continuidade ao seu atendimento! 😉`
      });
    }

    if ((textoLimpo === 'menu' || tempoInativo) && !usuario.ativo) {
      usuario.ativo = true;
      usuario.tentativasInvalidas = 0;
      usuariosEmAtendimento.set(from, usuario);

      return await client.sendMessage(from, {
        text: `Olá! Seja bem-vindo(a) à Kantine! 😊

Nos diga o que precisa selecionando um dos números abaixo:

*1*  – Encomendas de Bolos 🍰  
*2*  – Pedidos Delivery ou Retirada 🛵  
*3*  – Encomendas de Outros Produtos 🥐  
*4*  – Falar com um Atendente 💬  

🕒 *Horários de Funcionamento das Lojas*

📍 *Loja (Vinhedos e Getúlio)*  
• Seg: 12h – 19h  
• Ter a Sex: 10h – 18h  
• Sáb: 10h – 17h30  

📱 *WhatsApp e Delivery*  
• Seg: 12h – 19h  
• Ter a Sex: 10h – 18h  
• Sáb: 10h – 17h30`
      });
    }

   
    if (usuario.ativo) {
      switch (textoLimpo) {
        case '1':
          await client.sendMessage(from, {
            text: `Dê uma olhadinha em nosso cardápio: https://drive.google.com/file/d/1YVXaOwr9mdlE0FZJWbgXUjPhWC51tnGw\n\n*Preencha pra mim:*\n\nSeu nome:\nQual bolo você quer:\nQual data e horário você quer retirar:\n\n📦 Encomendas devem ser feitas com 48h de antecedência — se for de última hora, a gente vê com a cozinha se consegue te atender!\n\nPra voltar as opções do menu, digite "MENU".`
          });
          break;

        case '2':
          await client.sendMessage(from, {
            text: `Para facilitar o seu pedido de *delivery*, acesse: https://pedido.takeat.app/kantinegastronomia\n\nCaso queira fazer um pedido pra retiradas, é só selecionar a opção de *retirada* no site.\n\nPra voltar as opções do menu, digite "MENU".`
          });
          break;

        case '3':
          await client.sendMessage(from, {
            text: `Me diga qual produto você gostaria, a data de retirada e a quantidade.\n\nPra voltar as opções do menu, digite "MENU".`
          });
          break;

        case '4':
          await client.sendMessage(from, {
            text: `Já vou te passar para o atendente! 😊\n\nEnquanto isso, me diga como podemos te ajudar!!\n\nPra voltar as opções do menu, digite "MENU".`
          });
          break;

        default:
        
          usuario.tentativasInvalidas = (usuario.tentativasInvalidas || 0) + 1;

         
          if (usuario.tentativasInvalidas >= 2) {
            usuario.ativo = false;
            usuariosEmAtendimento.set(from, usuario);
            return await client.sendMessage(from, {
              text: `Já vou te passar para o atendente! 😊\n\nEnquanto isso, me diga como podemos te ajudar!!\n\nPra voltar as opções do menu, digite "MENU".`
            });
          }

          
          await client.sendMessage(from, {
            text: "Por favor, selecione uma das opções do menu!"
          });
          break;
      }

    
      if (['1', '2', '3', '4'].includes(textoLimpo)) {
        usuario.ativo = false;
        usuario.tentativasInvalidas = 0;
        usuariosEmAtendimento.set(from, usuario);
      }
    }
  });
}

createWhatsAppClient('kantine');
