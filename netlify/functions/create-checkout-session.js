// File: netlify/functions/create-checkout-session.js
require('dotenv').config();

exports.handler = async (event) => {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  // --- START: NEW DIAGNOSTIC LOGS ---
  console.log("--- create-checkout-session function triggered ---");
  console.log("Stripe Secret Key Loaded:", !!stripeSecretKey); // This will be true or false
  console.log("Raw incoming event body:", event.body);
  // --- END: NEW DIAGNOSTIC LOGS ---

  if (!stripeSecretKey) {
    console.error("CRITICAL: STRIPE_SECRET_KEY is not defined.");
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'CRITICAL: The STRIPE_SECRET_KEY environment variable was not found. Please check your Netlify site settings.'
      }),
    };
  }
  
  const stripe = require('stripe')(stripeSecretKey);
  
  // Replace the try...catch block in create-checkout-session.js with this

try {
    const { cart, userEmail } = JSON.parse(event.body);
    console.log("Successfully parsed body. Cart items:", cart, "User Email:", userEmail);

    if (!cart || cart.length === 0) {
      console.error("Validation Error: Cart is empty or missing.");
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Cart cannot be empty." }),
      };
    }

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
      console.log("Stripe Customer ID:", customerId);
    }

    // --- START: CORRECTED LOGIC ---
    // Build the session payload object dynamically
    const sessionPayload = {
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${process.env.URL}/success.html`,
      cancel_url: `${process.env.URL}/cancel.html`,
      shipping_address_collection: {
        allowed_countries: ['US', 'CA'],
      },
    };

    // Only add the 'customer' property if a customerId exists.
    if (customerId) {
      sessionPayload.customer = customerId;
    }
    // --- END: CORRECTED LOGIC ---

    const session = await stripe.checkout.sessions.create(sessionPayload);

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (e) {
    console.error("--- AN ERROR OCCURRED ---");
    console.error("Error parsing JSON or with Stripe API:", e);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: `Stripe Error: ${e.message}` }),
    };
  }
};