import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    const rows = await sql`SELECT * FROM rsvps ORDER BY submitted_at DESC`;
    return res.status(200).json({ rsvps: rows });
  } catch (error) {
    console.error('Admin fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch RSVPs' });
  }
}
