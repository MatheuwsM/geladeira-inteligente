// v1.3 - Adicionando logs para depurar dados de entrada
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async function(event) {
  // Apenas processa pedidos POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // --- INÍCIO DA DEPURAÇÃO ---
  console.log("Corpo do pedido recebido:", event.body);
  // --- FIM DA DEPURAÇÃO ---
  
  const { name, price } = JSON.parse(event.body);
  
  // --- INÍCIO DA DEPURAÇÃO ---
  console.log(`Dados processados - Nome: ${name}, Preço: ${price}`);
  // --- FIM DA DEPURAÇÃO ---

  // Validação simples para garantir que os dados chegaram
  if (!name || !price) {
    console.error("Erro: Nome ou preço em falta no pedido.");
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Nome ou preço em falta." }),
    };
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'boleto'],
      line_items: [{
        price_data: {
          currency: 'brl',
          unit_amount: price,
          product_data: {
            name: name,
          },
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${event.headers.referer}?payment=success`,
      cancel_url: `${event.headers.referer}?payment=cancelled`,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        id: session.id,
        url: session.url
      }),
    };

  } catch (err) {
    console.error("Erro ao criar a sessão de checkout da Stripe:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

