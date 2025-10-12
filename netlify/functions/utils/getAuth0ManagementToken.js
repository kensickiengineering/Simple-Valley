// File: netlify/functions/utils/getAuth0ManagementToken.js
const axios = require('axios');

module.exports = async () => {
  const domain = process.env.AUTH0_DOMAIN;
  const clientId = process.env.AUTH0_MGT_CLIENT_ID;
  const clientSecret = process.env.AUTH0_MGT_CLIENT_SECRET;

  try {
    const response = await axios.post(`https://${domain}/oauth/token`, {
      client_id: clientId,
      client_secret: clientSecret,
      audience: `https://${dev-y6t0um4ltxspelep.us.auth0.com}/api/v2/`,
      grant_type: 'client_credentials',
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting Management API token:', error);
    throw new Error('Failed to get Management API token.');
  }
};