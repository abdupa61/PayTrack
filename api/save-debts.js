const { put } = require('@vercel/blob');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    return res.status(500).json({ error: "Vercel Blob is not configured on this environment." });
  }

  try {
    const records = req.body;

    if (!Array.isArray(records)) {
      return res.status(400).json({ error: 'Invalid data format. Expected an array of records.' });
    }

    // Write to Vercel Blob, overwrite if exists (addRandomSuffix: false)
    const blob = await put('paytrack.json', JSON.stringify(records, null, 2), {
      access: 'public',
      addRandomSuffix: false,
      token: token
    });

    return res.status(200).json({ success: true, url: blob.url });
  } catch (error) {
    console.error("API SAVE-DEBTS ERROR (BLOB):", error);
    return res.status(500).json({ error: error.message });
  }
};
