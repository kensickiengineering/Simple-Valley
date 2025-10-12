// File: netlify/functions/create-checkout-session.js
require('dotenv').config();

exports.handler = async (event) => {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  // --- START: DIAGNOSTIC CHECK ---
  // This block runs first. If the secret key is missing, it will
  // immediately stop and send a specific error to your browser.
  if (!stripeSecretKey) {
    return {
      statusCode: 500, // Internal Server Error
      body: JSON.stringify({
        error: 'CRITICAL: The STRIPE_SECRET_KEY environment variable was not found. Please check your Netlify site settings.'
      }),
    };
  }
  // --- END: DIAGNOSTIC CHECK ---

  const stripe = require('stripe')(stripeSecretKey);
  const { cart } = JSON.parse(event.body);

  const lineItems = cart.map(item => ({
    price: item.priceId,
    quantity: item.qty,
  }));

  try {
    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.URL}/success.html`,
      cancel_url: `${process.env.URL}/cancel.html`,
      shipping_address_collection: {
        allowed_countries: ['US', 'CA'],
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (e) {
    // If the key is present but INVALID, Stripe will throw an error here.
    return {
      statusCode: 400,
      body: JSON.stringify({ error: `Stripe Error: ${e.message}` }),
    };
  }
};