export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    return res.status(500).json({ error: "Vercel KV is not configured on this environment." });
  }

  try {
    const records = req.body;

    if (!Array.isArray(records)) {
      return res.status(400).json({ error: 'Invalid data format. Expected an array of records.' });
    }

    // Send the SET command as a JSON array in the POST body
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(['SET', 'paytrack_debts', JSON.stringify(records)])
    });

    if (!response.ok) {
      throw new Error(`KV REST API responded with status ${response.status}`);
    }

    const data = await response.json();
    return res.status(200).json({ success: true, result: data.result });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
