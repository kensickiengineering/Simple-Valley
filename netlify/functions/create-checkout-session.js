// File: netlify/functions/create-checkout-session.js
require('dotenv').config();

exports.handler = async (event) => {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  // --- START: NEW SHIPPING VARIABLES ---
  const standardShippingRateId = process.env.SHIPPING_RATE_STANDARD;
  const freeShippingRateId = process.env.SHIPPING_RATE_FREE;
  // --- END: NEW SHIPPING VARIABLES ---
  
  // Environment variable validation
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

    // --- START: NEW SHIPPING LOGIC ---
    // 1. Calculate the subtotal in cents to check against the threshold.
    // NOTE: This assumes item.price is the dollar value (e.g., 39.99)
    const subtotal = cart.reduce((sum, item) => sum + (item.price * 100 * item.qty), 0);

    // 2. Choose the correct shipping rate ID based on the subtotal.
    const applicableShippingRateId = subtotal >= 7500 ? freeShippingRateId : standardShippingRateId;
    // --- END: NEW SHIPPING LOGIC ---

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
      cancel_url: `${process.env.URL}/`, // Changed to root for better UX
      // --- MODIFIED: ADD SHIPPING OPTIONS ---
      // This key tells Stripe to add shipping. It implicitly collects the address.
      shipping_options: [
        {
          shipping_rate: applicableShippingRateId,
        },
      ],
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
      statusCode: 500, // Use 500 for internal server/API errors
      body: JSON.stringify({ error: `Stripe Error: ${e.message}` }),
    };
  }
};