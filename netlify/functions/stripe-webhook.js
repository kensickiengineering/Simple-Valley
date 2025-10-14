// /netlify/functions/stripe-webhook.js

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const axios = require('axios'); // You need to require/import axios

// --- YOUR EXISTING HELPER FUNCTION ---
async function createShippingLabel(name, address) {
    const SHIPPO_API_KEY = process.env.SHIPPO_API_KEY;

    // ... (Your existing Shippo logic) ...

    const shipmentDetails = {
        address_from: {
            name: 'SIMPLE VALLEY',
            street1: 'Your Street',
            city: 'Your City',
            state: 'MA',
            zip: 'Your ZIP',
            country: 'US',
        },
        address_to: {
            name: name,
            street1: address.street1,
            // ... (rest of address details) ...
        },
        parcels: [{
            length: "8",
            width: "6",
            height: "1",
            distance_unit: "in",
            weight: "12",
            mass_unit: "oz"
        }],
        async: false
    };

    const shipmentResponse = await axios.post('https://api.goshippo.com/shipments/', shipmentDetails, {
        headers: { 'Authorization': `ShippoToken ${SHIPPO_API_KEY}` }
    });

    const rates = shipmentResponse.data.rates;
    const cheapestRate = rates.find(rate => rate.provider === 'USPS' && rate.servicelevel.token === 'usps_ground_advantage');

    if (!cheapestRate) {
        throw new Error("Could not find a valid USPS Ground Advantage rate.");
    }

    const transactionResponse = await axios.post('https://api.goshippo.com/transactions/', {
        rate: cheapestRate.object_id,
        label_file_type: "PDF_4x6",
        async: false
    }, {
        headers: { 'Authorization': `ShippoToken ${SHIPPO_API_KEY}` }
    });

    console.log('Label created! URL:', transactionResponse.data.label_url);
    return transactionResponse.data.tracking_number;
}
// ------------------------------------


// --- THE REQUIRED HANDLER FUNCTION ---
exports.handler = async (event, context) => {
    // 1. Ensure it's a POST request
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const sig = event.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let eventData;

    try {
        // 2. Construct the event using the raw body and secret
        eventData = stripe.webhooks.constructEvent(event.body, sig, webhookSecret);
    } catch (err) {
        console.log(`⚠️ Webhook signature verification failed.`, err.message);
        return { statusCode: 400, body: `Webhook Error: ${err.message}` };
    }

    // 3. Handle the event type
    switch (eventData.type) {
        case 'checkout.session.completed':
            const session = eventData.data.object;
            console.log('Checkout Session Completed:', session.id);

            try {
                // Get customer and shipping details
                const shippingAddress = session.shipping_details.address;
                const customerName = session.shipping_details.name;

                // 4. CALL YOUR HELPER FUNCTION HERE
                const trackingNumber = await createShippingLabel(customerName, shippingAddress);
                console.log(`Tracking Number: ${trackingNumber}`);
                
                // You would typically update your database/order here

            } catch (shippingError) {
                console.error('Error creating shipping label:', shippingError.message);
                // Return 200 to Stripe but log the error for yourself
            }
            break;
        
        // Add other event types here if needed (e.g., 'payment_intent.succeeded')

        default:
            // Unexpected event type
            console.log(`Unhandled event type ${eventData.type}`);
    }

    // 5. Return a 200 response to Stripe to acknowledge receipt
    return {
        statusCode: 200,
        body: JSON.stringify({ received: true }),
    };
};
case 'checkout.session.completed':
  const session = eventData.data.object;
  const shippingAddress = session.shipping_details?.address || {
      street1: '123 Test St',
      city: 'Boston',
      state: 'MA',
      zip: '02118',
      country: 'US'
  };
  const customerName = session.shipping_details?.name || 'Test Customer';
