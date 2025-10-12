// File: netlify/functions/reset-user-password.js
const getAuth0ManagementToken = require('./utils/getAuth0ManagementToken');
const axios = require('axios');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { email } = JSON.parse(event.body);
    if (!email) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Email is required.' }) };
    }

    const token = await getAuth0ManagementToken();
    const domain = process.env.AUTH0_DOMAIN;

    await axios.post(`https://${domain}/api/v2/tickets/password-change`, 
      { email: email, connection_id: 'con_yOS8VKwqGsgkhy34' }, // IMPORTANT: Replace with your DB Connection ID
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    return { statusCode: 200, body: JSON.stringify({ message: 'Password reset email sent.' }) };
  } catch (error) {
    console.error('Error sending password reset:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to send password reset email.' }) };
  }
};