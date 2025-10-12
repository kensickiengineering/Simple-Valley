const axios = require('axios');

console.log('🔍 Environment check:', {
  AUTH0_DOMAIN: process.env.AUTH0_DOMAIN,
  AUTH0_MGT_CLIENT_ID: process.env.AUTH0_MGT_CLIENT_ID ? '[set]' : '[missing]',
  AUTH0_MGT_CLIENT_SECRET: process.env.AUTH0_MGT_CLIENT_SECRET ? '[set]' : '[missing]'
});

module.exports = async () => {
  const domain = process.env.AUTH0_DOMAIN;
  const clientId = process.env.AUTH0_MGT_CLIENT_ID;
  const clientSecret = process.env.AUTH0_MGT_CLIENT_SECRET;

  console.log('Auth0 domain in function:', domain);

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
