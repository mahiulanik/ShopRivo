import database from "../config/db.js";

export async function createCategoriesTable() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS categories(
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await database.query(query);

  } catch (error) {
    console.error("❌ Failed To Create Categories Table.", error);
    process.exit(1);
  }
}