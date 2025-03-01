import mysql from "mysql";

export const db = mysql.createPool({
  connectionLimit: 10, 
  host: "localhost",
  user: "root",
  password: "password",
  database: "safe_peer_db",
  port: 3306
});

// Test the database connection pool
db.getConnection((err, connection) => {
    if (err) {
        console.error("Error connecting to the database:", err.stack);
    } else {
        console.log("Connected to the database.");
        connection.release(); // Release the connection back to the pool
    }
});

export const queryDatabase = (sql, args=[]) => {
    if (args.length === 0) {
        return new Promise((resolve, reject) => {
            db.query(sql, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }
    else {
        return new Promise((resolve, reject) => {
        db.query(sql, args, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
    }
};
