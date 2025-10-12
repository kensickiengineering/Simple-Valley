const axios = require('axios');

module.exports = async () => {
  const domain = process.env.AUTH0_DOMAIN; // should be dev-y6t0um4ltxspelep.us.auth0.com
  const clientId = process.env.AUTH0_MGT_CLIENT_ID;
  const clientSecret = process.env.AUTH0_MGT_CLIENT_SECRET;
console.log('Auth0 domain:', domain);
console.log('Audience:', `https://${domain}/api/v2/`);

  try {
    const response = await axios.post(`https://${domain}/oauth/token`, {
      client_id: clientId,
      client_secret: clientSecret,
      audience: `https://${domain}/api/v2/`,
      grant_type: 'client_credentials',
    });

    return response.data.access_token;
  } catch (error) {
    console.error('Error getting Management API token:', error.response?.data || error.message);
    throw new Error('Failed to get Management API token.');
  }
};