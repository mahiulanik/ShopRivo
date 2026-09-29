import database from "../config/db.js";


export async function createRefreshSessionTable() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS refresh_sessions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash TEXT UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await database.query(query);

  } catch (error) {
    console.error(
      "❌ Failed To Create Refresh Sessions Table.",
      error
    );

    process.exit(1);
  }
}