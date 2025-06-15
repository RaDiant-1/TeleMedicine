const mysql = require("mysql2")
require("dotenv").config()

// Create connection pool for better performance and connection management
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "telemed_pro",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  multipleStatements: true,
})

// Test the connection and create database if it doesn't exist
const testConnection = async () => {
  try {
    const connection = await pool.getConnection()
    console.log("✅ Connected to MySQL database successfully")

    // Test a simple query
    const [rows] = await connection.execute("SELECT 1 as test")
    console.log("✅ Database query test successful")

    connection.release()
    return true
  } catch (err) {
    console.error("❌ Database connection failed:", err.message)
    console.error("Please check your database configuration:")
    console.error(`- Host: ${process.env.DB_HOST || "localhost"}`)
    console.error(`- User: ${process.env.DB_USER || "root"}`)
    console.error(`- Database: ${process.env.DB_NAME || "telemed_pro"}`)
    return false
  }
}

// Initialize database connection
testConnection()

module.exports = pool.promise()
