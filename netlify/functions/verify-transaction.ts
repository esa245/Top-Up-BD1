import { Handler } from "@netlify/functions";

export const handler: Handler = async (event, context) => {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
    'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const bodyData = event.body ? JSON.parse(event.body) : {};
    const { transactionId, amount, method } = bodyData;

    // Simulate a real verification delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const isValid = transactionId && transactionId.length >= 8 && transactionId.length <= 16 && /^[A-Z0-9]+$/i.test(transactionId);

    if (isValid) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: "Transaction verified successfully!" }),
      };
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: "Invalid Transaction ID format. Must be 8-16 alphanumeric characters." }),
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: "Verification failed." }),
    };
  }
};
