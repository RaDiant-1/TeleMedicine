// Import packages
const http = require("http")
const express = require("express")
const session = require("express-session")
const MySQLStore = require("express-mysql-session")(session)
const path = require("path")
const cors = require("cors")
require("dotenv").config()

const db = require("./config/db")
const authRoutes = require("./routes/auth")
const appointmentRoutes = require("./routes/appointments")
const contactRoutes = require("./routes/contact")

// Initialize Express app
const app = express()
let server // Declare server variable

// Database connection verification
const verifyDatabaseConnection = async () => {
  try {
    const [rows] = await db.execute("SELECT 1 as connected")
    console.log("🔗 Database connection verified")
    return true
  } catch (error) {
    console.error("❌ Database connection failed:", error.message)
    console.error("Please ensure your database is running and environment variables are set correctly")
    return false
  }
}

// Trust proxy for secure cookies in production
app.set("trust proxy", 1)

// CORS configuration
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://yourdomain.com"]
        : ["http://localhost:3300", "http://127.0.0.1:3300"],
    credentials: true,
  }),
)

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")))

// Body parsing middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Session configuration with database store
const sessionStore = new MySQLStore(
  {
    clearExpired: true,
    checkExpirationInterval: 900000, // 15 minutes
    expiration: 1800000, // 30 minutes
    createDatabaseTable: true,
    schema: {
      tableName: "sessions",
      columnNames: {
        session_id: "session_id",
        expires: "expires",
        data: "data",
      },
    },
  },
  db,
)

app.use(
  session({
    key: "user_sid",
    secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      maxAge: 1800000, // 30 minutes
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      httpOnly: true, // Prevent XSS attacks
      sameSite: "lax", // CSRF protection
    },
  }),
)

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff")
  res.setHeader("X-Frame-Options", "DENY")
  res.setHeader("X-XSS-Protection", "1; mode=block")
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin")

  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
  }

  next()
})

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`)
  next()
})

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"))
})

// Health check endpoint with database status
app.get("/health", async (req, res) => {
  const dbConnected = await verifyDatabaseConnection()

  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? "OK" : "Service Unavailable",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    database: dbConnected ? "Connected" : "Disconnected",
  })
})

// API routes
app.use("/auth", authRoutes)
app.use("/appointments", appointmentRoutes)
app.use("/contact", contactRoutes)

// 404 handler for API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({
    message: "API endpoint not found",
    success: false,
  })
})

// Serve index.html for all other routes (SPA support)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"))
})

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error handler:", err)

  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
    success: false,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  })
})

// Graceful shutdown handling
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully")
  if (server) {
    server.close(() => {
      console.log("Process terminated")
      process.exit(0)
    })
  }
})

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully")
  if (server) {
    server.close(() => {
      console.log("Process terminated")
      process.exit(0)
    })
  }
})

// Start server with database verification
const startServer = async () => {
  const dbConnected = await verifyDatabaseConnection()

  if (!dbConnected) {
    console.error("❌ Cannot start server without database connection")
    console.error("Please check your database configuration and try again")
    process.exit(1)
  }

  const port = process.env.PORT || 3300
  server = app.listen(port, () => {
    console.log(`🚀 TeleMed Pro server running on http://localhost:${port}`)
    console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`)
    console.log(`🔒 Session store: MySQL`)
    console.log(`⏰ Session timeout: 30 minutes`)
    console.log(`💾 Database: Connected`)
  })

  // Handle server errors
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`❌ Port ${port} is already in use`)
      process.exit(1)
    } else {
      console.error("❌ Server error:", err)
    }
  })
}

// Start the server
startServer()

module.exports = app
