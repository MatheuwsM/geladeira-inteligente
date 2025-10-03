// Importa a biblioteca MQTT para enviar o comando
const mqtt = require('mqtt');

exports.handler = async ({ body, headers }) => {
  try {
    // A API da Stripe é um exemplo, não vamos implementá-la aqui.
    // Em um cenário real, você validaria a assinatura do webhook da Stripe.
    
    const stripeEvent = JSON.parse(body);

    // Verifica se o evento é 'checkout.session.completed'
    if (stripeEvent.type === 'checkout.session.completed') {
      console.log('Pagamento recebido com sucesso!');

      // ================== CONFIGURAÇÕES MQTT ==================
      const MQTT_HOST = 'broker.hivemq.com';
      const MQTT_PORT = '1883';
      const UNIQUE_ID = "geladeira-secreta-123";
      // =======================================================

      const commandTopic = `geladeira/command/${UNIQUE_ID}`;
      const client = mqtt.connect(`mqtt://${MQTT_HOST}:${MQTT_PORT}`);

      client.on('connect', () => {
        const message = JSON.stringify({ action: "abrir" });
        
        // Publica a mensagem para o ESP32
        client.publish(commandTopic, message, () => {
          console.log('Comando de abrir enviado para o ESP32.');
          client.end(); // Fecha a conexão
        });
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };
  } catch (err) {
    console.log(`Stripe webhook failed with ${err}`);
    return {
      statusCode: 400,
      body: `Webhook Error: ${err.message}`,
    };
  }
};
