module.exports = async function handler(req, res) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    return res.status(500).json({ error: "Vercel KV is not configured on this environment." });
  }

  try {
    // Send command as a JSON array in the POST body to avoid URL-encoding/length issues
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(['GET', 'paytrack_debts'])
    });

    if (!response.ok) {
      throw new Error(`KV REST API responded with status ${response.status}`);
    }

    const data = await response.json();
    
    // The response is { result: "stringified_value" } or { result: null }
    const records = data.result ? JSON.parse(data.result) : [];
    
    return res.status(200).json(records);
  } catch (error) {
    console.error("API GET-DEBTS ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
};
