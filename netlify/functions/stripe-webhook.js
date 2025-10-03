const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const mqtt = require('mqtt');

// ================== CONFIGURAÇÕES DE SEGURANÇA ==================
// ID único para os nossos canais MQTT. Deve ser o mesmo no ESP32.
const UNIQUE_ID = "geladeira-secreta-123";
// ==============================================================

exports.handler = async function(event) {
  // Apenas processa pedidos POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const session = JSON.parse(event.body);

    // Verifica se o evento é o que esperamos
    if (session.type === 'checkout.session.completed') {
      console.log("✅ Webhook da Stripe recebido com sucesso!");

      // Tenta enviar o comando para o ESP32 via MQTT
      try {
        await sendUnlockCommand();
        console.log("✅ Comando 'abrir' enviado para o MQTT com sucesso.");
      } catch (mqttError) {
        console.error("❌ ERRO ao enviar comando MQTT:", mqttError);
        // Mesmo com erro de MQTT, respondemos à Stripe que recebemos o webhook
        // para evitar que ela continue a tentar enviar.
      }
    } else {
      console.log(`Evento não tratado recebido: ${session.type}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };

  } catch (err) {
    console.error("❌ Erro ao processar o corpo do webhook:", err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }
};


// Função para enviar o comando de abrir, agora com gestão de ligação
function sendUnlockCommand() {
  return new Promise((resolve, reject) => {
    const commandTopic = `geladeira/command/${UNIQUE_ID}`;
    const mqttBrokerUrl = 'mqtt://broker.hivemq.com:1883';
    
    console.log("A tentar ligar-se ao broker MQTT...");
    const client = mqtt.connect(mqttBrokerUrl);

    // Evento que é chamado quando a ligação é bem-sucedida
    client.on('connect', () => {
      console.log("Ligado ao broker MQTT com sucesso!");
      
      const message = JSON.stringify({ action: "abrir" });
      
      client.publish(commandTopic, message, (err) => {
        if (err) {
          console.error("Erro ao publicar mensagem:", err);
          client.end(); // Fecha a ligação
          reject(err); // Rejeita a promessa com o erro
        } else {
          console.log(`Mensagem publicada no tópico: ${commandTopic}`);
          client.end(); // Fecha a ligação
          resolve(); // Resolve a promessa com sucesso
        }
      });
    });

    // Evento que é chamado se ocorrer um erro na ligação
    client.on('error', (err) => {
      console.error("Erro de ligação MQTT:", err);
      client.end();
      reject(err);
    });
  });
}

