const express = require("express")
const db = require("../config/db")
const bcrypt = require("bcryptjs")
const session = require("express-session")

// User registration function/logic
exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body

  // Input validation
  if (!name || !email || !password) {
    return res.status(400).json({
      message: "All fields are required",
      success: false,
    })
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      message: "Please provide a valid email address",
      success: false,
    })
  }

  // Password validation
  if (password.length < 6) {
    return res.status(400).json({
      message: "Password must be at least 6 characters long",
      success: false,
    })
  }

  try {
    // Check if user exists in database
    const [rows] = await db.execute("SELECT * FROM users WHERE email = ?", [email])
    if (rows.length > 0) {
      return res.status(400).json({
        message: "User already exists with this email",
        success: false,
      })
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Insert the record in the database (fixed syntax error)
    const [result] = await db.execute("INSERT INTO users (name, email, password, created_at) VALUES (?, ?, ?, NOW())", [
      name,
      email,
      hashedPassword,
    ])

    res.status(201).json({
      message: "User registered successfully",
      success: true,
      userId: result.insertId,
    })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({
      message: "An error occurred during registration",
      success: false,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

exports.loginUser = async (req, res) => {
  const { email, password } = req.body

  // Input validation
  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required",
      success: false,
    })
  }

  try {
    // Check if user exists
    const [rows] = await db.execute("SELECT * FROM users WHERE email = ?", [email])
    if (rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
        success: false,
      })
    }

    const user = rows[0]

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
        success: false,
      })
    }

    // Set session data
    req.session.userId = user.id
    req.session.email = user.email
    req.session.name = user.name

    // Update last login
    await db.execute("UPDATE users SET last_login = NOW() WHERE id = ?", [user.id])

    res.status(200).json({
      message: "Login successful",
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({
      message: "An error occurred during login",
      success: false,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

exports.logoutUser = async (req, res) => {
  try {
    // Destroy the session
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err)
        return res.status(500).json({
          message: "Could not log out, please try again",
          success: false,
        })
      }
      res.clearCookie("user_sid") // Clear the session cookie
      return res.status(200).json({
        message: "Logout successful",
        success: true,
      })
    })
  } catch (error) {
    console.error("Logout error:", error)
    res.status(500).json({
      message: "An error occurred during logout",
      success: false,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Get current user info
exports.getCurrentUser = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        message: "Not authenticated",
        success: false,
      })
    }

    const [rows] = await db.execute("SELECT id, name, email, created_at, last_login FROM users WHERE id = ?", [
      req.session.userId,
    ])

    if (rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      })
    }

    res.status(200).json({
      success: true,
      user: rows[0],
    })
  } catch (error) {
    console.error("Get user error:", error)
    res.status(500).json({
      message: "An error occurred while fetching user data",
      success: false,
    })
  }
}
