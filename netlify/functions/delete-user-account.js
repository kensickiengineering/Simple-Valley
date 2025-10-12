// File: netlify/functions/delete-user-account.js
const getAuth0ManagementToken = require('./utils/getAuth0ManagementToken');
const axios = require('axios');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { userId } = JSON.parse(event.body);
    if (!userId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'User ID is required.' }) };
    }

    const token = await getAuth0ManagementToken();
    const domain = process.env.AUTH0_DOMAIN;

    await axios.delete(`https://${domain}/api/v2/users/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    return { statusCode: 200, body: JSON.stringify({ message: 'Account deleted successfully.' }) };
  } catch (error) {
    console.error('Error deleting account:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to delete account.' }) };
  }
};