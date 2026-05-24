export default async function handler(req, res) {
  // CORS ayarları
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Vercel entegrasyonu genelde bu isimleri veya NEXT_PUBLIC_ ön ekli hallerini kullanır
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: "Supabase environment variables are missing." });
  }

  try {
    // Supabase REST API ile id=1 olan satırı çekiyoruz
    const response = await fetch(`${supabaseUrl}/rest/v1/app_data?id=eq.1&select=data`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`Supabase returned ${response.status}: ${await response.text()}`);
    }

    const rows = await response.json();

    // Eğer tablo boşsa veya veri yoksa, boş bir obje/dizi dönebiliriz.
    if (!rows || rows.length === 0) {
      return res.status(200).json([]);
    }

    // Tüm PayTrack verisi JSON olarak `data` sütununda tutuluyor
    return res.status(200).json(rows[0].data || []);
  } catch (error) {
    console.error("Supabase load error:", error);
    return res.status(500).json({ error: "Failed to load data from Supabase." });
  }
}
