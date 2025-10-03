// Importa a biblioteca da Stripe
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  try {
    // Extrai os dados do produto enviados pelo site
    const { productName, priceInCents, successUrl, cancelUrl } = JSON.parse(event.body);

    // Cria uma Sessão de Checkout na Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'boleto'],
      line_items: [
        {
          price_data: {
            currency: 'brl', // Moeda: Real Brasileiro
            product_data: {
              name: productName,
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl, // URL para onde o cliente volta se pagar
      cancel_url: cancelUrl,   // URL para onde o cliente volta se cancelar
    });

    // Devolve o URL de pagamento para o site
    return {
      statusCode: 200,
      body: JSON.stringify({ checkoutUrl: session.url }),
    };
  } catch (error) {
    return { statusCode: 500, body: error.toString() };
  }
};
