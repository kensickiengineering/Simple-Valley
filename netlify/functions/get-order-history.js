// File: netlify/functions/get-order-history.js
require('dotenv').config();

exports.handler = async (event) => {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Stripe secret key not found.' }),
    };
  }

  const stripe = require('stripe')(stripeSecretKey);
  
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { user } = JSON.parse(event.body);
    if (!user || !user.email) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized: User email not provided.' }) };
    }

    // 1. Find the Stripe Customer ID from the user's email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      return { statusCode: 200, body: JSON.stringify([]) }; // No customer means no orders.
    }
    const customerId = customers.data[0].id;

    // 2. Retrieve all checkout sessions for that customer
    const sessions = await stripe.checkout.sessions.list({
      customer: customerId,
      expand: ['data.line_items'], // Important: This includes product details in the response
    });

    // 3. Format the data to send back to the frontend
    const orders = sessions.data
      // --- THE IMPORTANT CHANGE IS HERE ---
      // We filter by session status 'complete', which is the most reliable indicator of a finished order.
      .filter(session => session.status === 'complete')
      .map(session => ({
        id: session.id,
        date: new Date(session.created * 1000).toLocaleDateString(),
        total: `$${(session.amount_total / 100).toFixed(2)}`,
        items: session.line_items.data.map(item => ({
          name: item.description,
          quantity: item.quantity,
        })),
      }));

    return {
      statusCode: 200,
      body: JSON.stringify(orders),
    };
  } catch (error) {
    console.error('Error fetching order history:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to fetch order history.' }) };
  }
};