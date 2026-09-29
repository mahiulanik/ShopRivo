import database from "../config/db.js";

export async function createMediaTable() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS media(
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        public_id TEXT UNIQUE NOT NULL,
        url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await database.query(query);

  } catch (error) {
    console.error("❌ Failed To Create Media Table.", error);
    process.exit(1);
  }
}