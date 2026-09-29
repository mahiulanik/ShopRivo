import database from "../config/db.js";

export async function createProductReviewsTable() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS reviews(
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rating DECIMAL(3,2) NOT NULL CHECK (rating BETWEEN 0 AND 5),
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (product_id, user_id)
      );
    `;

    await database.query(query);

  } catch (error) {
    console.error("❌ Failed To Create Product Reviews Table.", error);
    process.exit(1);
  }
}