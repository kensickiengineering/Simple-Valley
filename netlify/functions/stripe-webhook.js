const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const axios = require('axios');

// --- Helper: Create shipping label via Shippo ---
async function createShippingLabel(name, address) {
  const SHIPPO_API_KEY = process.env.SHIPPO_API_KEY;

  const shipmentDetails = {
    address_from: {
      name: 'SIMPLE VALLEY',
      street1: '123 Example Rd',
      city: 'Boston',
      state: 'MA',
      zip: '02118',
      country: 'US',
      phone: '5551234567',
      email: 'support@simplevalley.com',
    },
    address_to: {
      name: name,
      street1: address.street1,
      city: address.city,
      state: address.state,
      zip: address.postal_code || address.zip,
      country: address.country,
    },
    parcels: [
      {
        length: '8',
        width: '6',
        height: '1',
        distance_unit: 'in',
        weight: '12',
        mass_unit: 'oz',
      },
    ],
    async: false,
  };

  try {
    const shipmentResponse = await axios.post(
      'https://api.goshippo.com/shipments/',
      shipmentDetails,
      {
        headers: { Authorization: `ShippoToken ${SHIPPO_API_KEY}` },
      }
    );

    const rates = shipmentResponse.data.rates;
    const cheapestRate = rates.find(
      (rate) =>
        rate.provider === 'USPS' &&
        rate.servicelevel?.token === 'usps_ground_advantage'
    );

    if (!cheapestRate) {
      throw new Error('No valid USPS Ground Advantage rate found.');
    }

    const transactionResponse = await axios.post(
      'https://api.goshippo.com/transactions/',
      {
        rate: cheapestRate.object_id,
        label_file_type: 'PDF_4x6',
        async: false,
      },
      {
        headers: { Authorization: `ShippoToken ${SHIPPO_API_KEY}` },
      }
    );

    console.log('✅ Label created:', transactionResponse.data.label_url);
    return transactionResponse.data.tracking_number;
  } catch (error) {
    console.error('❌ Shippo API error:', error.response?.data || error.message);
    throw error;
  }
}

// --- Netlify Function Handler ---
exports.handler = async (event) => {
  // 1️⃣ Verify HTTP method
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // 2️⃣ Get raw body for Stripe signature verification
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body;

  const sig = event.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let eventData;
  try {
    eventData = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  // 3️⃣ Handle events
  switch (eventData.type) {
    case 'checkout.session.completed': {
      const session = eventData.data.object;
      console.log('✅ Checkout Session Completed:', session.id);

      const shippingAddress = session.shipping_details?.address;
      const customerName = session.shipping_details?.name;
      const customerEmail = session.customer_email;

      if (!shippingAddress || !customerName) {
        console.warn('⚠️ Missing shipping details — skipping Shippo label.');
        break;
      }

      try {
        const trackingNumber = await createShippingLabel(
          customerName,
          shippingAddress
        );
        console.log(`🚚 Shipping label created. Tracking #: ${trackingNumber}`);
        // TODO: Update your order DB here, if applicable.
      } catch (err) {
        console.error('❌ Error creating shipping label:', err.message);
      }
      break;
    }

    default:
      console.log(`Unhandled event type: ${eventData.type}`);
  }

  // 4️⃣ Acknowledge Stripe
  return {
    statusCode: 200,
    body: JSON.stringify({ received: true }),
  };
};
