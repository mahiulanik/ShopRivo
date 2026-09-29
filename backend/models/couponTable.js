import database from "../config/db.js";

export async function createCouponsTable() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS coupons(
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        discount_type VARCHAR(10) NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
        discount_value INTEGER NOT NULL CHECK (discount_value > 0),
        min_amount INTEGER NOT NULL DEFAULT 0 CHECK (min_amount >= 0),
        expires_at DATE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await database.query(query);

  } catch (error) {
    console.error("❌ Failed To Create Coupons Table.", error);
    process.exit(1);
  }
}