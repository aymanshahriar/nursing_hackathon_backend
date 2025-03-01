import mysql from "mysql2/promise";

// Create a connection pool
export const db = mysql.createPool({
  connectionLimit: 10,
  host: "localhost",
  user: "root",
  password: "password",
  database: "safe_peer_db",
  port: 3306
});

// Test the database connection pool
(async () => {
    try {
        const connection = await db.getConnection();
        console.log("Connected to the database.");
        connection.release(); // Release the connection back to the pool
    } catch (err) {
        console.error("Error connecting to the database:", err.message);
    }
})();