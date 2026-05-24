const { list } = require('@vercel/blob');

module.exports = async function handler(req, res) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    return res.status(500).json({ error: "Vercel Blob is not configured on this environment." });
  }

  try {
    // List blobs to find our paytrack.json file
    const { blobs } = await list({ token });
    const paytrackBlob = blobs.find(b => b.pathname === 'paytrack.json');

    if (!paytrackBlob) {
      // If the file doesn't exist yet, return an empty list
      return res.status(200).json([]);
    }

    // Fetch the contents of the public JSON file from Vercel Blob
    const response = await fetch(paytrackBlob.url);
    if (!response.ok) {
      throw new Error(`Failed to fetch blob content: ${response.statusText}`);
    }

    const records = await response.json();
    return res.status(200).json(records);
  } catch (error) {
    console.error("API GET-DEBTS ERROR (BLOB):", error);
    return res.status(500).json({ error: error.message });
  }
};
