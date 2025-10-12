// File: netlify/functions/update-user-email.js
const getAuth0ManagementToken = require('./utils/getAuth0ManagementToken');
const axios = require('axios');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { userId, newEmail } = JSON.parse(event.body);
    if (!userId || !newEmail) {
      return { statusCode: 400, body: JSON.stringify({ error: 'User ID and new email are required.' }) };
    }

    const token = await getAuth0ManagementToken();
    const domain = process.env.AUTH0_DOMAIN;

    await axios.patch(`https://${domain}/api/v2/users/${userId}`, 
      { email: newEmail },
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    return { statusCode: 200, body: JSON.stringify({ message: 'Email updated successfully.' }) };
  } catch (error) {
    console.error('Error updating email:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to update email.' }) };
  }
};