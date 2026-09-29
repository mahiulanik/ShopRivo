import pkg from "pg";

const { Pool } = pkg;

const database = new Pool({
    connectionString: process.env.DB_URL,
    ssl: {
        rejectUnauthorized: false,
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

database.on("error", (error) => {
    console.error("Unexpected PostgreSQL connection error:", error.message);
});

export const connectDB = async () => {

    try {
        await database.query("SELECT 1");
        console.log("Connected to the database successfully");

    } catch (error) {
        console.error("Database connection failed:", error);
        process.exit(1);
    }
};


export default database;