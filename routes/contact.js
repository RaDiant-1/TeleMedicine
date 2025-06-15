const express = require("express")
const db = require("../config/db")
const router = express.Router()

// Submit contact form
router.post("/submit", async (req, res) => {
  const { name, email, subject, message } = req.body

  // Input validation
  if (!name || !email || !subject || !message) {
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

  // Validate subject
  const validSubjects = ["general", "technical", "billing", "appointment", "feedback"]
  if (!validSubjects.includes(subject)) {
    return res.status(400).json({
      message: "Please select a valid subject",
      success: false,
    })
  }

  try {
    // Insert contact message
    const [result] = await db.execute(
      "INSERT INTO contact_messages (name, email, subject, message, status, created_at) VALUES (?, ?, ?, ?, 'new', NOW())",
      [name, email, subject, message],
    )

    res.status(201).json({
      message: "Thank you for your message! We'll get back to you within 24 hours.",
      success: true,
      messageId: result.insertId,
    })
  } catch (error) {
    console.error("Contact form error:", error)
    res.status(500).json({
      message: "An error occurred while sending your message",
      success: false,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
})

// Get all contact messages (admin only - for future implementation)
router.get("/messages", async (req, res) => {
  try {
    const [messages] = await db.execute(
      "SELECT id, name, email, subject, message, status, created_at FROM contact_messages ORDER BY created_at DESC",
    )

    res.status(200).json({
      success: true,
      messages: messages,
    })
  } catch (error) {
    console.error("Get contact messages error:", error)
    res.status(500).json({
      message: "An error occurred while fetching messages",
      success: false,
    })
  }
})

module.exports = router
