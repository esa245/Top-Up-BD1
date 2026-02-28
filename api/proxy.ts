export default async function handler(req: any, res: any) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Safely parse body (Vercel might pass it as string or object)
    const bodyData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const action = bodyData?.action;

    if (!action) {
      return res.status(400).json({ error: 'Action is required' });
    }
    
    // Hardcoded fallback to ensure it ALWAYS works on Vercel even if env vars fail
    const API_KEY = process.env.MOTHER_PANEL_API_KEY || "2c67ea4f797ab16122ab7344c5a0f5dd";
    const API_URL = "https://motherpanel.com/api/v2";

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
      res.status(200).json(data);
    } catch (e) {
      console.error("Failed to parse MotherPanel response:", text);
      res.status(500).json({ error: "Invalid response from provider API", details: text.substring(0, 200) });
    }
  } catch (error: any) {
    console.error("API Proxy Error:", error);
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
}
