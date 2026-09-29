import database from "../config/db.js";

export async function createOrdersTable() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS orders(
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        total_price INTEGER NOT NULL CHECK (total_price >= 0),
        shipping_price INTEGER NOT NULL CHECK (shipping_price >= 0),
        coupon_code VARCHAR(50),
        discount INTEGER NOT NULL DEFAULT 0 CHECK (discount >= 0),
        order_status VARCHAR(50) DEFAULT 'Processing' CHECK (order_status IN ('Processing', 'Shipped', 'Delivered', 'Cancelled')),
        paid_at TIMESTAMP CHECK (paid_at IS NULL OR paid_at <= CURRENT_TIMESTAMP),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await database.query(query);

  } catch (error) {
    console.error("❌ Failed To Create Orders Table.", error);
    process.exit(1);
  }
}