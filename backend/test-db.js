const mysql = require('mysql2/promise');
require('dotenv').config({ quiet: true });

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'InventorySalesDB',
    });
    console.log("Connected successfully.");
    const [rows] = await connection.execute('SHOW TABLES');
    console.log("Tables:", rows);
    connection.end();
  } catch (error) {
    console.error("Connection failed:", error.message);
  }
}

testConnection();
