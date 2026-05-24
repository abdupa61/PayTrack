export default async function handler(req, res) {
  // CORS ayarları
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: "Supabase environment variables are missing." });
  }

  try {
    const dataToSave = req.body;

    // id=1 olan kaydı güncelleyeceğiz veya yoksa oluşturacağız
    const payload = {
      id: 1,
      data: dataToSave
    };

    // Supabase REST API'de UPSERT yapmak için Prefer: resolution=merge-duplicates eklenir
    const response = await fetch(`${supabaseUrl}/rest/v1/app_data`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates' 
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Supabase returned ${response.status}: ${await response.text()}`);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Supabase save error:", error);
    return res.status(500).json({ error: "Failed to save data to Supabase." });
  }
}
