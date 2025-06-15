const mysql = require("mysql2/promise")
require("dotenv").config()

async function initializeDatabase() {
  let connection

  try {
    // First, connect without specifying a database to create it if needed
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      multipleStatements: true,
    })

    console.log("🔗 Connected to MySQL server")

    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || "telemed_pro"
    await connection.execute(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    )
    console.log(`✅ Database '${dbName}' created or already exists`)

    // Switch to the database
    await connection.execute(`USE \`${dbName}\``)

    // Create users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        date_of_birth DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        last_login TIMESTAMP NULL,
        is_active BOOLEAN DEFAULT TRUE,
        email_verified BOOLEAN DEFAULT FALSE,
        INDEX idx_email (email),
        INDEX idx_created_at (created_at)
      )
    `)
    console.log("✅ Users table created")

    // Create appointments table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        date_of_birth DATE,
        appointment_date DATE NOT NULL,
        appointment_time TIME NOT NULL,
        service_type ENUM('primary-care', 'urgent-care', 'chronic-disease', 'mental-health', 'pediatrics', 'specialist') NOT NULL,
        reason TEXT NOT NULL,
        insurance_provider VARCHAR(100),
        status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_user_id (user_id),
        INDEX idx_appointment_date (appointment_date),
        INDEX idx_status (status)
      )
    `)
    console.log("✅ Appointments table created")

    // Create contact_messages table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject ENUM('general', 'technical', 'billing', 'appointment', 'feedback') NOT NULL,
        message TEXT NOT NULL,
        status ENUM('new', 'in_progress', 'resolved') DEFAULT 'new',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      )
    `)
    console.log("✅ Contact messages table created")

    // Create sessions table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        session_id VARCHAR(128) COLLATE utf8mb4_bin NOT NULL,
        expires INT(11) UNSIGNED NOT NULL,
        data MEDIUMTEXT COLLATE utf8mb4_bin,
        PRIMARY KEY (session_id)
      )
    `)
    console.log("✅ Sessions table created")

    // Create doctors table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS doctors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        specialty VARCHAR(255) NOT NULL,
        bio TEXT,
        credentials TEXT,
        image_url VARCHAR(500),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_specialty (specialty),
        INDEX idx_is_active (is_active)
      )
    `)
    console.log("✅ Doctors table created")

    // Insert sample doctors if they don't exist
    const [doctorRows] = await connection.execute("SELECT COUNT(*) as count FROM doctors")
    if (doctorRows[0].count === 0) {
      await connection.execute(`
        INSERT INTO doctors (name, email, specialty, bio, credentials, image_url) VALUES
        ('Dr. Sarah Williams', 'sarah.williams@telemedpro.com', 'Internal Medicine', '15+ years experience in primary care and telemedicine', 'MD, Board Certified Internal Medicine, Johns Hopkins Graduate', '/placeholder.svg?height=200&width=200'),
        ('Dr. James Chen', 'james.chen@telemedpro.com', 'Pediatrics', 'Specialized in child and adolescent healthcare', 'MD, Board Certified Pediatrics, Stanford Graduate', '/placeholder.svg?height=200&width=200'),
        ('Dr. Maria Rodriguez', 'maria.rodriguez@telemedpro.com', 'Mental Health', 'Licensed clinical psychologist and therapist', 'PhD, Licensed Psychologist, UCLA Graduate', '/placeholder.svg?height=200&width=200')
      `)
      console.log("✅ Sample doctors inserted")
    }

    console.log("🎉 Database initialization completed successfully!")
  } catch (error) {
    console.error("❌ Database initialization failed:", error.message)
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

// Run initialization if this script is executed directly
if (require.main === module) {
  initializeDatabase()
}

module.exports = initializeDatabase
