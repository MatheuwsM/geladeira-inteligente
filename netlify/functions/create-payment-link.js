// v1.4 - Corrigindo o nome das variáveis recebidas do frontend
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async function(event) {
  // Apenas processa pedidos POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  console.log("Corpo do pedido recebido:", event.body);
  
  // CORREÇÃO AQUI: Estamos a extrair 'productName' e 'priceInCents'
  // e a renomeá-los para 'name' e 'price' para o resto da função.
  const { productName: name, priceInCents: price } = JSON.parse(event.body);
  
  console.log(`Dados processados - Nome: ${name}, Preço: ${price}`);

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

