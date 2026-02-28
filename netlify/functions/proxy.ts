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
    // Safely parse body
    const bodyData = event.body ? JSON.parse(event.body) : {};
    const action = bodyData?.action;

    if (!action) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Action is required' }),
      };
    }
    
    // Log request for debugging in Netlify console
    console.log(`Proxying action: ${action} to MotherPanel`);
    
    // Hardcoded fallback to ensure it ALWAYS works on Netlify even if env vars fail
    const API_KEY = process.env.MOTHER_PANEL_API_KEY || "2c67ea4f797ab16122ab7344c5a0f5dd";
    const API_URL = "https://motherpanel.com/api/v2";

    if (API_KEY === "2c67ea4f797ab16122ab7344c5a0f5dd") {
      console.warn("Using fallback API key. Please set MOTHER_PANEL_API_KEY in Netlify environment variables.");
    }

    const formBody = new URLSearchParams();
    formBody.append("key", API_KEY);
    formBody.append("action", action);
    
    // Append any other parameters passed from the frontend
    if (bodyData) {
      Object.entries(bodyData).forEach(([key, value]) => {
        if (key !== 'action' && key !== 'key' && value !== undefined) {
          formBody.append(key, String(value));
        }
      });
    }

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: formBody.toString(),
    });

    const text = await response.text();
    
    try {
      const data = JSON.parse(text);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data),
      };
    } catch (e) {
      console.error("Failed to parse MotherPanel response:", text);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Invalid response from provider API", details: text.substring(0, 200) }),
      };
    }
  } catch (error: any) {
    console.error("API Proxy Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal Server Error", message: error.message }),
    };
  }
};
