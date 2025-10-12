const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// You'll need to verify the Auth0 user. This is a simplified example.
// In a real app, you would use a library like 'express-jwt' or 'jose' to verify the token.
const { auth } = require('express-oauth2-jwt-bearer');

// This is a placeholder for real JWT verification.
// For a production app, securely verify the token sent from your frontend.
const getVerifiedUserEmail = (event) => {
    // In a real implementation, you would decode and verify the JWT from the
    // 'Authorization' header and extract the user's email.
    // For this example, we'll assume the email is passed directly for simplicity.
    // **Warning:** Do not do this in production without proper token verification.
    const { user } = JSON.parse(event.body);
    return user.email;
};


exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const userEmail = getVerifiedUserEmail(event);
        if (!userEmail) {
            return { statusCode: 401, body: 'Unauthorized' };
        }

        // 1. Find the Stripe Customer ID from the email
        const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
        if (customers.data.length === 0) {
            return { statusCode: 200, body: JSON.stringify([]) }; // No orders found
        }
        const customerId = customers.data[0].id;

        // 2. Retrieve all completed checkout sessions for that customer
        const sessions = await stripe.checkout.sessions.list({
            customer: customerId,
            expand: ['data.line_items'], // This is crucial to get product details
        });

        // 3. Format the data to send back to the frontend
        const orders = sessions.data
            .filter(session => session.payment_status === 'paid') // Only show paid orders
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