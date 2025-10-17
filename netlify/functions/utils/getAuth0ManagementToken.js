const axios = require('axios');
const getManagementToken = require('./getManagementToken');

exports.handler = async (event) => {
  const { email } = JSON.parse(event.body);
  const domain = process.env.AUTH0_DOMAIN;
  const token = await getManagementToken();

  try {
    // 1️⃣ Find the user by email
    const users = await axios.get(
      `https://${domain}/api/v2/users-by-email`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: { email },
      }
    );

    if (!users.data.length) {
      return { statusCode: 404, body: JSON.stringify({ message: 'User not found' }) };
    }

    const user = users.data[0];

    // 2️⃣ Check their connection type
    if (user.identities[0].connection !== 'Username-Password-Authentication') {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: `Password reset not applicable for social login (${user.identities[0].connection})`,
        }),
      };
    }

    // 3️⃣ Generate a password reset ticket
    const ticketRes = await axios.post(
      `https://${domain}/api/v2/tickets/password-change`,
      { email },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ ticket_url: ticketRes.data.ticket }),
    };
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to process password reset.' }),
    };
  }
};
