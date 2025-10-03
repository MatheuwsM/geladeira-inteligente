const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async function(event) {
  // Apenas processa pedidos POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { name, price } = JSON.parse(event.body);

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'boleto'],
      line_items: [{
        price_data: {
          currency: 'brl',
          product_data: {
            name: name,
          },
          unit_amount: price,
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

