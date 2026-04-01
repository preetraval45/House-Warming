import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sql = neon(process.env.DATABASE_URL);

  const { attending, fullName, email, phone, adults, children, message } = req.body;

  if (!attending || !fullName || !email || !adults) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS rsvps (
        id SERIAL PRIMARY KEY,
        attending TEXT NOT NULL,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        adults TEXT NOT NULL,
        children TEXT DEFAULT '0',
        message TEXT,
        submitted_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    await sql`
      INSERT INTO rsvps (attending, full_name, email, phone, adults, children, message)
      VALUES (${attending}, ${fullName}, ${email}, ${phone || ''}, ${adults}, ${children || '0'}, ${message || ''})
    `;

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('RSVP submission error:', error);
    return res.status(500).json({ error: 'Failed to save RSVP' });
  }
}
