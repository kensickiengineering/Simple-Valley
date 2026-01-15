// File: netlify/functions/create-checkout-session.js
require("dotenv").config();
const Stripe = require("stripe");

exports.handler = async (event) => {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const standardShippingRateId = process.env.SHIPPING_RATE_STANDARD;
  const freeShippingRateId = process.env.SHIPPING_RATE_FREE;
  const siteUrl = process.env.URL;

  if (!stripeSecretKey || !siteUrl) {
    console.error("Missing Stripe secret key or site URL");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server misconfigured." }),
    };
  }

  const stripe = new Stripe(stripeSecretKey);

  try {
    const { cart, userEmail } = JSON.parse(event.body || "{}");

    if (!cart || cart.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Cart cannot be empty." }),
      };
    }

    // Compute subtotal (in cents)
    const subtotal = cart.reduce((sum, item) => sum + item.price * 100, 0);
    const applicableShippingRateId =
      subtotal >= 7500 ? freeShippingRateId : standardShippingRateId;

    // Map items
    const line_items = cart.map((item) => ({
      price: item.priceId,
      quantity: 1,
    }));

    // Find or create customer
    let customerId = null;
    if (userEmail) {
      const existing = await stripe.customers.list({ email: userEmail, limit: 1 });
      if (existing.data.length > 0) customerId = existing.data[0].id;
      else customerId = (await stripe.customers.create({ email: userEmail })).id;
    }

    const sessionPayload = {
      mode: "payment",
      line_items,
      payment_method_types: ["card"],
      success_url: `${siteUrl}/success.html`,
      cancel_url: `${siteUrl}/`,
      customer: customerId || undefined,

      shipping_address_collection: {
        allowed_countries: ["US"], // adjust to your region
      },

...(applicableShippingRateId && {
  shipping_options: [{ shipping_rate: applicableShippingRateId }],
}),


      // (Stripe will return normalized addresses, usable in webhook)
      metadata: {
        source: "simple-valley",
      },
    };

    const session = await stripe.checkout.sessions.create(sessionPayload);

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (error) {
    console.error("Error creating Checkout Session:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
