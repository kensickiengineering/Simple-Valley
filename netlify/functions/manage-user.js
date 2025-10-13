// File: netlify/functions/manage-user.js
require('dotenv').config();
const axios = require('axios');

// Helper function to get a Management API token from Auth0
const getManagementApiToken = async () => {
  try {
    const response = await axios.post(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
      client_id: process.env.AUTH0_MGMT_CLIENT_ID,
      client_secret: process.env.AUTH0_MGMT_CLIENT_SECRET,
      audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
      grant_type: 'client_credentials',
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting Management API token:', error.response ? error.response.data : error.message);
    throw new Error('Could not retrieve management token.');
  }
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { action, userId, newEmail } = JSON.parse(event.body);
    if (!action || !userId) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Action and User ID are required.' }) };
    }

    const mgmtToken = await getManagementApiToken();
    const auth0ApiUrl = `https://${process.env.AUTH0_DOMAIN}/api/v2`;

    switch (action) {
      case 'changeEmail':
        if (!newEmail) {
            return { statusCode: 400, body: JSON.stringify({ error: 'New email is required.' }) };
        }
        await axios.patch(`${auth0ApiUrl}/users/${userId}`, { 
            email: newEmail,
            verify_email: true,
            client_id: process.env.AUTH0_CLIENT_ID
        }, {
          headers: { Authorization: `Bearer ${mgmtToken}` },
        });
        return { statusCode: 200, body: JSON.stringify({ message: 'Email update process initiated.' }) };

      case 'changePassword':
        const userResponse = await axios.get(`${auth0ApiUrl}/users/${userId}`, {
          headers: { Authorization: `Bearer ${mgmtToken}` },
        });
        const userEmail = userResponse.data.email;
        
        await axios.post(`${auth0ApiUrl}/tickets/password-change`, {
          email: userEmail,
          connection_id: process.env.AUTH0_DB_CONNECTION_ID,
          client_id: process.env.AUTH0_CLIENT_ID // Specifies WHICH application is making the request
        }, {
          headers: { Authorization: `Bearer ${mgmtToken}` },
        });
        return { statusCode: 200, body: JSON.stringify({ message: 'Password reset email sent.' }) };

      case 'deleteAccount':
        await axios.delete(`${auth0ApiUrl}/users/${userId}`, {
          headers: { Authorization: `Bearer ${mgmtToken}` },
        });
        return { statusCode: 200, body: JSON.stringify({ message: 'Account deleted successfully.' }) };

      default:
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid action specified.' }) };
    }
  } catch (error) {
    console.error('Error in manage-user function:', error.response ? error.response.data : error.message);
    return { statusCode: 500, body: JSON.stringify({ error: 'An internal server error occurred.' }) };
  }
};