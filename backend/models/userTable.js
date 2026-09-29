import database from "../config/db.js";

export async function createUserTable() {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS users(
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                name VARCHAR(100) NOT NULL CHECK (char_length(name) >= 3),
                email VARCHAR(100) UNIQUE NOT NULL,
                password TEXT DEFAULT NULL,
                google_id VARCHAR(255) UNIQUE DEFAULT NULL,
                auth_provider VARCHAR(20) NOT NULL DEFAULT 'local' CHECK (auth_provider IN ('local', 'google')),
                role VARCHAR(10) DEFAULT 'User' CHECK (role IN ('User', 'Uploader', 'Admin')),
                avatar JSONB DEFAULT NULL,
                reset_password_token TEXT DEFAULT NULL,
                reset_password_expire TIMESTAMP DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;

        await database.query(query);
        
    } catch (error) {
        console.error("❌ Failed To Create Products Table.", error)
        process.exit(1)
    }
}