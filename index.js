<<<<<<< HEAD
const { 
  default: makeWASocket, 
  useMultiFileAuthState, 
  DisconnectReason 
} = require('baileys');
const path = require('path');

let isReconnecting = false;
const usuariosEmAtendimento = new Map();

// Função para criar o cliente do WhatsApp
async function createWhatsAppClient(instanceId = 'default') {
  const storePath = path.join(__dirname, `auth_info_${instanceId}`);
  const { state, saveCreds } = await useMultiFileAuthState(storePath);

  // Criação do cliente
  const client = makeWASocket({
    auth: state,
    printQRInTerminal: true
  });

  // Gerenciar a conexão do cliente
  client.ev.on('connection.update', handleConnectionUpdate(client, instanceId));
  client.ev.on('creds.update', saveCreds);

  // Processar mensagens recebidas
  client.ev.on('messages.upsert', handleMessages(client));

  return client;
}

// Função que lida com o status de conexão
function handleConnectionUpdate(client, instanceId) {
  return (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

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
  };
}

// Função para lidar com as mensagens recebidas
async function handleMessages(client) {
  return async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const textoLimpo = extractText(msg);
    const agora = Date.now();
    const usuario = usuariosEmAtendimento.get(from) || { ativo: false, ultimoContato: 0 };
    const tempoInativo = agora - usuario.ultimoContato > 30 * 60 * 1000;  // 2hrs de inatividade
    usuario.ultimoContato = agora;

    if (textoLimpo === 'menu' && !usuario.ativo) {
      await showMenu(client, from, usuario, tempoInativo);
    }

    if (usuario.ativo) {
      await handleUserChoice(client, from, textoLimpo, usuario);
    } else if (tempoInativo && !usuario.ativo) {
      await handleInactiveUser(client, from);
    }
  };
}

// Função para extrair o texto da mensagem
function extractText(msg) {
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
  return texto.trim().toLowerCase();
}

// Função para exibir o menu para o cliente
async function showMenu(client, from, usuario, tempoInativo) {
  usuario.ativo = true;
  usuariosEmAtendimento.set(from, usuario);

  const horaAtual = new Date().getHours();
  let opcaoFalarCom = "Falar com a Dani 💬";
  if (horaAtual >= 16 && horaAtual <= 19) {
    opcaoFalarCom = "Falar com a Brielle 💬";
  }

  await client.sendMessage(from, {
    text: `Olá! Seja bem-vindo(a) à Kantine 😊\n\nNos diga o que precisa selecionando um dos números abaixo:\n\n*1*  – Encomendas de Bolos 🍰\n*2*  – Pedidos Delivery ou Retirada 🛵\n*3*  – Encomendas de Outros Produtos 🥐\n*4*  – Horários de Atendimento 🕒 \n*5*  – ${opcaoFalarCom} `
  });
}

// Função para lidar com a escolha do cliente
async function handleUserChoice(client, from, textoLimpo, usuario) {
  switch (textoLimpo) {
    case '1':
      await client.sendMessage(from, { text: `Dê uma olhadinha em nosso cardápio: https://drive.google.com/file/d/1YVXaOwr9mdlE0FZJWbgXUjPhWC51tnGw\nMe diga qual bolo, tamanho, data e horário de retirada que já já eu pego seu pedido! 😉\n\n📦 Encomendas devem ser feitas com 48h de antecedência.` });
      break;
    case '2':
      await client.sendMessage(from, { text: `Para facilitar o seu pedido de *delivery*, acesse: https://pedido.takeat.app/kantinegastronomia\nCaso queira fazer um pedido pra retiradas, é só selecionar a opção de *retirada* no site.` });
      break;
    case '3':
      await client.sendMessage(from, { text: `Me diga qual produto você gostaria, a data de retirada e a quantidade.` });
      break;
    case '4':
      await client.sendMessage(from, { text: `🕒 *Horários de Atendimento*\n📍 Loja (Vinhedos e Getúlio)\n• Seg: 12h – 19h\n• Ter a Sex: 09h – 19h\n• Sáb: 09h – 18h\n📱 WhatsApp e Delivery\n• Seg: 12h – 19h\n• Ter a Sex: 10h – 18h\n• Sáb: 10h – 17h30`});
      break;
    case '5':
      await client.sendMessage(from, { text: `Beleza! Já já te respondo!`});
      break;
    default:
      await client.sendMessage(from, { text: `Por favor, selecione uma das opções do menu!` });
      break;
  }

  usuario.ativo = false;
  usuariosEmAtendimento.set(from, usuario);
}


// Inicia o cliente
createWhatsAppClient('kantine');
=======
const { 
  default: makeWASocket, 
  useMultiFileAuthState, 
  DisconnectReason 
} = require('baileys');
const path = require('path');

let isReconnecting = false;
const usuariosEmAtendimento = new Map();

// Função para criar o cliente do WhatsApp
async function createWhatsAppClient(instanceId = 'default') {
  const storePath = path.join(__dirname, `auth_info_${instanceId}`);
  const { state, saveCreds } = await useMultiFileAuthState(storePath);

  // Criação do cliente
  const client = makeWASocket({
    auth: state,
    printQRInTerminal: true
  });

  // Gerenciar a conexão do cliente
  client.ev.on('connection.update', handleConnectionUpdate(client, instanceId));
  client.ev.on('creds.update', saveCreds);

  // Processar mensagens recebidas
  client.ev.on('messages.upsert', handleMessages(client));

  return client;
}

// Função que lida com o status de conexão
function handleConnectionUpdate(client, instanceId) {
  return (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

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
  };
}

// Função para lidar com as mensagens recebidas
async function handleMessages(client) {
  return async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const textoLimpo = extractText(msg);
    const agora = Date.now();
    const usuario = usuariosEmAtendimento.get(from) || { ativo: false, ultimoContato: 0 };
    const tempoInativo = agora - usuario.ultimoContato > 30 * 60 * 1000;  // 2hrs de inatividade
    usuario.ultimoContato = agora;

    if (textoLimpo === 'menu' && !usuario.ativo) {
      await showMenu(client, from, usuario, tempoInativo);
    }

    if (usuario.ativo) {
      await handleUserChoice(client, from, textoLimpo, usuario);
    } else if (tempoInativo && !usuario.ativo) {
      await handleInactiveUser(client, from);
    }
  };
}

// Função para extrair o texto da mensagem
function extractText(msg) {
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
  return texto.trim().toLowerCase();
}

// Função para exibir o menu para o cliente
async function showMenu(client, from, usuario, tempoInativo) {
  usuario.ativo = true;
  usuariosEmAtendimento.set(from, usuario);

  const horaAtual = new Date().getHours();
  let opcaoFalarCom = "Falar com a Dani 💬";
  if (horaAtual >= 16 && horaAtual <= 19) {
    opcaoFalarCom = "Falar com a Brielle 💬";
  }

  await client.sendMessage(from, {
    text: `Olá! Seja bem-vindo(a) à Kantine 😊\n\nNos diga o que precisa selecionando um dos números abaixo:\n\n*1*  – Encomendas de Bolos 🍰\n*2*  – Pedidos Delivery ou Retirada 🛵\n*3*  – Encomendas de Outros Produtos 🥐\n*4*  – Horários de Atendimento 🕒 \n*5*  – ${opcaoFalarCom} `
  });
}

// Função para lidar com a escolha do cliente
async function handleUserChoice(client, from, textoLimpo, usuario) {
  switch (textoLimpo) {
    case '1':
      await client.sendMessage(from, { text: `Dê uma olhadinha em nosso cardápio: https://drive.google.com/file/d/1YVXaOwr9mdlE0FZJWbgXUjPhWC51tnGw\nMe diga qual bolo, tamanho, data e horário de retirada que já já eu pego seu pedido! 😉\n\n📦 Encomendas devem ser feitas com 48h de antecedência.` });
      break;
    case '2':
      await client.sendMessage(from, { text: `Para facilitar o seu pedido de *delivery*, acesse: https://pedido.takeat.app/kantinegastronomia\nCaso queira fazer um pedido pra retiradas, é só selecionar a opção de *retirada* no site.` });
      break;
    case '3':
      await client.sendMessage(from, { text: `Me diga qual produto você gostaria, a data de retirada e a quantidade.` });
      break;
    case '4':
      await client.sendMessage(from, { text: `🕒 *Horários de Atendimento*\n📍 Loja (Vinhedos e Getúlio)\n• Seg: 12h – 19h\n• Ter a Sex: 09h – 19h\n• Sáb: 09h – 18h\n📱 WhatsApp e Delivery\n• Seg: 12h – 19h\n• Ter a Sex: 10h – 18h\n• Sáb: 10h – 17h30`});
      break;
    case '5':
      await client.sendMessage(from, { text: `Beleza! Já já te respondo!`});
      break;
    default:
      await client.sendMessage(from, { text: `Por favor, selecione uma das opções do menu!` });
      break;
  }

  usuario.ativo = false;
  usuariosEmAtendimento.set(from, usuario);
}


// Inicia o cliente
createWhatsAppClient('kantine');
>>>>>>> 6e7f5ea (código original)
