// File: netlify/functions/create-checkout-session.js
require('dotenv').config();

exports.handler = async (event) => {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  // --- START: DIAGNOSTIC CHECK ---
  if (!stripeSecretKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'CRITICAL: The STRIPE_SECRET_KEY environment variable was not found. Please check your Netlify site settings.'
      }),
    };
  }
  // --- END: DIAGNOSTIC CHECK ---

  const stripe = require('stripe')(stripeSecretKey);
  
  try {
    // 1. Destructure cart AND userEmail from the request body
    const { cart, userEmail } = JSON.parse(event.body);

    const line_items = cart.map(item => ({
      price: item.priceId,
      quantity: item.qty,
    }));

    let customerId = null;

    // 2. If a user is logged in (userEmail is provided), find or create a customer
    if (userEmail) {
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      
      if (customers.data.length > 0) {
        // Customer already exists in Stripe
        customerId = customers.data[0].id;
      } else {
        // New user, so create a new customer in Stripe
        const newCustomer = await stripe.customers.create({ email: userEmail });
        customerId = newCustomer.id;
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${process.env.URL}/success.html`,
      cancel_url: `${process.env.URL}/cancel.html`,
      shipping_address_collection: {
        allowed_countries: ['US', 'CA'],
      },
      // 3. Associate the session with the Stripe Customer ID
      customer: customerId,
      // If the customer is new, this pre-fills their email on the checkout page
      customer_email: customerId ? undefined : userEmail,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: `Stripe Error: ${e.message}` }),
    };
  }
};