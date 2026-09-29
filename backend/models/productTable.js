import database from "../config/db.js";

export async function createProductsTable() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS products(
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        price INTEGER NOT NULL CHECK (price >= 0),
        category VARCHAR(100) NOT NULL,
        color VARCHAR(50),
        colors JSONB DEFAULT '[]',
        variants JSONB DEFAULT '[]',
        ratings DECIMAL(3,2) DEFAULT 0 CHECK (ratings BETWEEN 0 AND 5),
        images JSONB DEFAULT '[]',
        stock INTEGER NOT NULL CHECK (stock >= 0),
        created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await database.query(query);

  } catch (error) {
    console.error("❌ Failed To Create Products Table.", error);
    process.exit(1);
  }
}