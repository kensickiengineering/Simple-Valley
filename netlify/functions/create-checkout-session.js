// File: netlify/functions/create-checkout-session.js
require('dotenv').config();

exports.handler = async (event) => {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const standardShippingRateId = process.env.SHIPPING_RATE_STANDARD;
  const freeShippingRateId = process.env.SHIPPING_RATE_FREE;
  
  if (!stripeSecretKey || !standardShippingRateId || !freeShippingRateId) {
    console.error("CRITICAL: A required environment variable is missing.");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server configuration error. Please contact support.' }),
    };
  }
  
  const stripe = require('stripe')(stripeSecretKey);
  
  try {
    const { cart, userEmail } = JSON.parse(event.body);

    if (!cart || cart.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Cart cannot be empty." }),
      };
    }

    const subtotal = cart.reduce((sum, item) => sum + (item.price * 100 * item.qty), 0);
    const applicableShippingRateId = subtotal >= 7500 ? freeShippingRateId : standardShippingRateId;

    const line_items = cart.map(item => ({
      price: item.priceId,
      quantity: item.qty,
    }));

    let customerId = null;
    if (userEmail) {
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        const newCustomer = await stripe.customers.create({ email: userEmail });
        customerId = newCustomer.id;
      }
    }

    const sessionPayload = {
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${process.env.URL}/success.html`,
      cancel_url: `${process.env.URL}/`,
      shipping_options: [
        {
          shipping_rate: applicableShippingRateId,
        },
      ],
      // --- START: NEW AND CRITICAL ADDITIONS ---

      // 1. Explicitly tell Stripe to collect the shipping address.
      shipping_address_collection: {
        allowed_countries: ['US', 'CA'], // Specify which countries you ship to
      },

      // 2. Enable Stripe's automatic tax calculation.
      automatic_tax: {
        enabled: true,
      },
      
      // --- END: NEW AND CRITICAL ADDITIONS ---
    };

    if (customerId) {
      sessionPayload.customer = customerId;
    }

    const session = await stripe.checkout.sessions.create(sessionPayload);

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (e) {
    console.error("Error creating Stripe session:", e);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Stripe Error: ${e.message}` }),
    };
  }
};
