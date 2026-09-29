import database from "../config/db.js";

export async function createPaymentsTable() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS payments(
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
        payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('Online', 'Cash on Delivery')),
        payment_status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Paid', 'Failed', 'Canceled', 'Refunded')),
        payment_intent_id VARCHAR(255) UNIQUE,
        refund_id VARCHAR(255) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await database.query(query);

  } catch (error) {
    console.error("❌ Failed To Create Payments Table.", error);
    process.exit(1);
  }
}