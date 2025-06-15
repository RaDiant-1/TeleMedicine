const express = require("express")
const { registerUser, loginUser, logoutUser, getCurrentUser } = require("../controllers/authController")
const router = express.Router()

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({
      message: "Authentication required",
      success: false,
    })
  }
  next()
}

// User registration
router.post("/register", registerUser)

// User login
router.post("/login", loginUser)

// User logout
router.post("/logout", logoutUser)

// Get current user (protected route)
router.get("/me", requireAuth, getCurrentUser)

// Check authentication status
router.get("/status", (req, res) => {
  res.json({
    authenticated: !!req.session.userId,
    userId: req.session.userId || null,
    email: req.session.email || null,
    name: req.session.name || null,
  })
})

module.exports = router
