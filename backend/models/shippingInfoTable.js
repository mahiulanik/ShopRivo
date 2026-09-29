import database from "../config/db.js";

export async function createShippingInfoTable() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS shipping_info(
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        order_id UUID UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        contact_name VARCHAR(100) NOT NULL,
        phone VARCHAR(30) NOT NULL,
        address TEXT NOT NULL,
        area VARCHAR(255),
        city VARCHAR(100) NOT NULL,
        district VARCHAR(100) NOT NULL,
        pincode VARCHAR(20) NOT NULL,
        country VARCHAR(100) NOT NULL DEFAULT 'Bangladesh',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await database.query(query);

    await database.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_shipping_saved_address
      ON shipping_info(user_id)
      WHERE order_id IS NULL;
    `);

  } catch (error) {
    console.error("❌ Failed To Create Shipping Info Table.", error);
    process.exit(1);
  }
}