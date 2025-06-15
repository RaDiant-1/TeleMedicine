// Global application state
const App = {
  currentUser: null,
  isAuthenticated: false,

  // Initialize the application
  init() {
    this.setupEventListeners()
    this.checkAuthStatus()
    this.setupMobileMenu()
    this.setupModals()
    this.setupFormValidation()
    this.setupSmoothScrolling()
  },

  // Check if user is authenticated
  async checkAuthStatus() {
    try {
      const response = await fetch("/auth/status")
      const data = await response.json()

      this.isAuthenticated = data.authenticated
      this.currentUser = data.authenticated
        ? {
            id: data.userId,
            email: data.email,
            name: data.name,
          }
        : null

      this.updateAuthUI()
    } catch (error) {
      console.error("Error checking auth status:", error)
    }
  },

  // Update UI based on authentication status
  updateAuthUI() {
    const authLink = document.getElementById("auth-link")
    const portalAccess = document.getElementById("portal-access")

    if (this.isAuthenticated && this.currentUser) {
      authLink.textContent = `Welcome, ${this.currentUser.name}`
      authLink.href = "#"
      authLink.onclick = (e) => {
        e.preventDefault()
        this.showUserMenu()
      }

      if (portalAccess) {
        portalAccess.textContent = "Access Your Portal"
        portalAccess.onclick = () => this.accessPatientPortal()
      }
    } else {
      authLink.textContent = "Login"
      authLink.onclick = (e) => {
        e.preventDefault()
        this.showAuthModal()
      }

      if (portalAccess) {
        portalAccess.textContent = "Login to Access Portal"
        portalAccess.onclick = (e) => {
          e.preventDefault()
          this.showAuthModal()
        }
      }
    }
  },

  // Setup all event listeners
  setupEventListeners() {
    // Authentication forms
    document.getElementById("register-form")?.addEventListener("submit", this.handleRegister.bind(this))
    document.getElementById("login-form")?.addEventListener("submit", this.handleLogin.bind(this))

    // Other forms
    document.getElementById("appointment-form")?.addEventListener("submit", this.handleAppointment.bind(this))
    document.getElementById("contact-form")?.addEventListener("submit", this.handleContact.bind(this))

    // Auth tabs
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", this.switchAuthTab.bind(this))
    })
  },

  // Setup mobile menu
  setupMobileMenu() {
    const hamburger = document.querySelector(".hamburger")
    const navMenu = document.querySelector(".nav-menu")

    if (hamburger && navMenu) {
      hamburger.addEventListener("click", () => {
        navMenu.classList.toggle("active")
        hamburger.classList.toggle("active")
      })

      // Close menu when clicking on a link
      document.querySelectorAll(".nav-menu a").forEach((link) => {
        link.addEventListener("click", () => {
          navMenu.classList.remove("active")
          hamburger.classList.remove("active")
        })
      })
    }
  },

  // Setup modal functionality
  setupModals() {
    const modal = document.getElementById("auth-modal")
    const closeBtn = document.querySelector(".close")

    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        modal.style.display = "none"
      })
    }

    // Close modal when clicking outside
    window.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.style.display = "none"
      }
    })
  },

  // Setup form validation
  setupFormValidation() {
    // Real-time validation for email fields
    document.querySelectorAll('input[type="email"]').forEach((input) => {
      input.addEventListener("blur", this.validateEmail)
    })

    // Real-time validation for password fields
    document.querySelectorAll('input[type="password"]').forEach((input) => {
      input.addEventListener("input", this.validatePassword)
    })

    // Phone number formatting
    document.querySelectorAll('input[type="tel"]').forEach((input) => {
      input.addEventListener("input", this.formatPhoneNumber)
    })
  },

  // Setup smooth scrolling
  setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", function (e) {
        e.preventDefault()
        const target = document.querySelector(this.getAttribute("href"))
        if (target) {
          target.scrollIntoView({
            behavior: "smooth",
            block: "start",
          })
        }
      })
    })
  },

  // Show authentication modal
  showAuthModal() {
    const modal = document.getElementById("auth-modal")
    if (modal) {
      modal.style.display = "block"
    }
  },

  // Switch between login and register tabs
  switchAuthTab(e) {
    const targetTab = e.target.dataset.tab

    // Update tab buttons
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.classList.remove("active")
    })
    e.target.classList.add("active")

    // Update forms
    document.querySelectorAll(".auth-form").forEach((form) => {
      form.classList.remove("active")
    })
    document.getElementById(`${targetTab}-form`).classList.add("active")
  },

  // Handle user registration
  async handleRegister(e) {
    e.preventDefault()

    const form = e.target
    const formData = new FormData(form)
    const data = Object.fromEntries(formData)

    // Client-side validation
    if (!this.validateRegistrationData(data)) {
      return
    }

    try {
      this.setFormLoading(form, true)

      const response = await fetch("/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        this.showMessage("register-message", "Registration successful! You can now log in.", "success")
        form.reset()

        // Switch to login tab after successful registration
        setTimeout(() => {
          document.querySelector('[data-tab="login"]').click()
        }, 2000)
      } else {
        this.showMessage("register-message", result.message, "error")
      }
    } catch (error) {
      console.error("Registration error:", error)
      this.showMessage("register-message", "An error occurred during registration. Please try again.", "error")
    } finally {
      this.setFormLoading(form, false)
    }
  },

  // Handle user login
  async handleLogin(e) {
    e.preventDefault()

    const form = e.target
    const formData = new FormData(form)
    const data = Object.fromEntries(formData)

    try {
      this.setFormLoading(form, true)

      const response = await fetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        this.showMessage("login-message", "Login successful!", "success")
        this.currentUser = result.user
        this.isAuthenticated = true
        this.updateAuthUI()

        // Close modal after successful login
        setTimeout(() => {
          document.getElementById("auth-modal").style.display = "none"
          form.reset()
        }, 1500)
      } else {
        this.showMessage("login-message", result.message, "error")
      }
    } catch (error) {
      console.error("Login error:", error)
      this.showMessage("login-message", "An error occurred during login. Please try again.", "error")
    } finally {
      this.setFormLoading(form, false)
    }
  },

  // Handle user logout
  async handleLogout() {
    try {
      const response = await fetch("/auth/logout", {
        method: "POST",
      })

      const result = await response.json()

      if (result.success) {
        this.currentUser = null
        this.isAuthenticated = false
        this.updateAuthUI()
        alert("Logged out successfully!")
      }
    } catch (error) {
      console.error("Logout error:", error)
      alert("An error occurred during logout.")
    }
  },

  // Show user menu
  showUserMenu() {
    const menu = confirm(
      `Hello ${this.currentUser.name}!\n\nChoose an option:\nOK - Access Patient Portal\nCancel - Logout`,
    )

    if (menu) {
      this.accessPatientPortal()
    } else {
      this.handleLogout()
    }
  },

  // Access patient portal
  accessPatientPortal() {
    if (!this.isAuthenticated) {
      this.showAuthModal()
      return
    }

    alert(
      `Welcome to your Patient Portal, ${this.currentUser.name}!\n\nThis feature is coming soon. You'll be able to:\n• View medical records\n• Schedule appointments\n• Message your doctor\n• Request prescription refills`,
    )
  },

  // Handle appointment booking
  async handleAppointment(e) {
    e.preventDefault()

    const form = e.target
    const formData = new FormData(form)
    const data = Object.fromEntries(formData)

    // Validate appointment data
    if (!this.validateAppointmentData(data)) {
      return
    }

    try {
      this.setFormLoading(form, true)

      const response = await fetch("/appointments/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        this.showMessage("appointment-message", result.message, "success")
        form.reset()
      } else {
        this.showMessage("appointment-message", result.message, "error")
      }
    } catch (error) {
      console.error("Appointment booking error:", error)
      this.showMessage(
        "appointment-message",
        "An error occurred while booking your appointment. Please try again.",
        "error",
      )
    } finally {
      this.setFormLoading(form, false)
    }
  },

  // Handle contact form
  async handleContact(e) {
    e.preventDefault()

    const form = e.target
    const formData = new FormData(form)
    const data = Object.fromEntries(formData)

    try {
      this.setFormLoading(form, true)

      const response = await fetch("/contact/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        this.showMessage("contact-message-result", result.message, "success")
        form.reset()
      } else {
        this.showMessage("contact-message-result", result.message, "error")
      }
    } catch (error) {
      console.error("Contact form error:", error)
      this.showMessage(
        "contact-message-result",
        "An error occurred while sending your message. Please try again.",
        "error",
      )
    } finally {
      this.setFormLoading(form, false)
    }
  },

  // Validation functions
  validateRegistrationData(data) {
    if (!data.name || data.name.length < 2) {
      this.showMessage("register-message", "Please enter a valid name (at least 2 characters).", "error")
      return false
    }

    if (!this.isValidEmail(data.email)) {
      this.showMessage("register-message", "Please enter a valid email address.", "error")
      return false
    }

    if (!data.password || data.password.length < 6) {
      this.showMessage("register-message", "Password must be at least 6 characters long.", "error")
      return false
    }

    return true
  },

  validateAppointmentData(data) {
    const requiredFields = ["name", "email", "phone", "date", "time", "service", "reason"]

    for (const field of requiredFields) {
      if (!data[field]) {
        this.showMessage("appointment-message", `Please fill in the ${field.replace("-", " ")} field.`, "error")
        return false
      }
    }

    if (!this.isValidEmail(data.email)) {
      this.showMessage("appointment-message", "Please enter a valid email address.", "error")
      return false
    }

    // Check if appointment date is in the future
    const appointmentDate = new Date(data.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (appointmentDate < today) {
      this.showMessage("appointment-message", "Please select a future date for your appointment.", "error")
      return false
    }

    if (!data.terms) {
      this.showMessage("appointment-message", "Please agree to the Terms of Service and Privacy Policy.", "error")
      return false
    }

    return true
  },

  // Utility functions
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  validateEmail(e) {
    const email = e.target.value
    const isValid = App.isValidEmail(email)

    e.target.style.borderColor = email && !isValid ? "var(--error-color)" : ""
  },

  validatePassword(e) {
    const password = e.target.value
    const isValid = password.length >= 6

    e.target.style.borderColor = password && !isValid ? "var(--error-color)" : ""
  },

  formatPhoneNumber(e) {
    let value = e.target.value.replace(/\D/g, "")

    if (value.length >= 6) {
      value = value.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3")
    } else if (value.length >= 3) {
      value = value.replace(/(\d{3})(\d{3})/, "($1) $2")
    }

    e.target.value = value
  },

  setFormLoading(form, loading) {
    const submitBtn = form.querySelector('button[type="submit"]')

    if (loading) {
      form.classList.add("loading")
      submitBtn.disabled = true
      submitBtn.textContent = "Processing..."
    } else {
      form.classList.remove("loading")
      submitBtn.disabled = false
      submitBtn.textContent = submitBtn.dataset.originalText || "Submit"
    }
  },

  showMessage(elementId, message, type = "info") {
    const messageElement = document.getElementById(elementId)
    if (messageElement) {
      messageElement.textContent = message
      messageElement.className = `message ${type}`
      messageElement.style.display = "block"

      // Auto-hide success messages after 5 seconds
      if (type === "success") {
        setTimeout(() => {
          messageElement.style.display = "none"
        }, 5000)
      }
    }
  },
}

// Utility function for smooth scrolling to sections
function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId)
  if (section) {
    section.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }
}

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  App.init()
})

// Handle page visibility changes
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    // Refresh auth status when page becomes visible
    App.checkAuthStatus()
  }
})

// Export for potential module use
if (typeof module !== "undefined" && module.exports) {
  module.exports = App
}
