import database from "../config/db.js";

export async function createOrderItemTable() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS order_items(
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        price INTEGER NOT NULL CHECK (price >= 0),
        color VARCHAR(50),
        variant VARCHAR(50),
        image TEXT NOT NULL,
        title TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await database.query(query);

  } catch (error) {
    console.error("❌ Failed To Create Order Items Table.", error);
    process.exit(1);
  }
}