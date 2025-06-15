const express = require("express")
const db = require("../config/db")
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

// Book an appointment
router.post("/book", async (req, res) => {
  const { name, email, phone, dob, date, time, service, reason, insurance } = req.body

  // Input validation
  if (!name || !email || !phone || !date || !time || !service || !reason) {
    return res.status(400).json({
      message: "All required fields must be filled",
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

  // Date validation (must be in the future)
  const appointmentDate = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (appointmentDate < today) {
    return res.status(400).json({
      message: "Appointment date must be in the future",
      success: false,
    })
  }

  try {
    // Check for conflicting appointments (same date and time)
    const [existingAppointments] = await db.execute(
      "SELECT id FROM appointments WHERE appointment_date = ? AND appointment_time = ? AND status != 'cancelled'",
      [date, time],
    )

    if (existingAppointments.length > 0) {
      return res.status(409).json({
        message: "This time slot is already booked. Please choose a different time.",
        success: false,
      })
    }

    // Insert the appointment
    const [result] = await db.execute(
      `INSERT INTO appointments 
       (user_id, name, email, phone, date_of_birth, appointment_date, appointment_time, 
        service_type, reason, insurance_provider, status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [req.session.userId || null, name, email, phone, dob || null, date, time, service, reason, insurance || null],
    )

    res.status(201).json({
      message: "Appointment booked successfully! We'll contact you soon to confirm.",
      success: true,
      appointmentId: result.insertId,
    })
  } catch (error) {
    console.error("Appointment booking error:", error)
    res.status(500).json({
      message: "An error occurred while booking your appointment",
      success: false,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
})

// Get user's appointments (protected route)
router.get("/my-appointments", requireAuth, async (req, res) => {
  try {
    const [appointments] = await db.execute(
      `SELECT id, name, email, phone, appointment_date, appointment_time, 
              service_type, reason, insurance_provider, status, created_at
       FROM appointments 
       WHERE user_id = ? 
       ORDER BY appointment_date DESC, appointment_time DESC`,
      [req.session.userId],
    )

    res.status(200).json({
      success: true,
      appointments: appointments,
    })
  } catch (error) {
    console.error("Get appointments error:", error)
    res.status(500).json({
      message: "An error occurred while fetching appointments",
      success: false,
    })
  }
})

// Cancel an appointment (protected route)
router.put("/cancel/:id", requireAuth, async (req, res) => {
  const appointmentId = req.params.id

  try {
    // Check if appointment belongs to user and is not already cancelled
    const [appointments] = await db.execute(
      "SELECT id, status, appointment_date, appointment_time FROM appointments WHERE id = ? AND user_id = ?",
      [appointmentId, req.session.userId],
    )

    if (appointments.length === 0) {
      return res.status(404).json({
        message: "Appointment not found",
        success: false,
      })
    }

    const appointment = appointments[0]

    if (appointment.status === "cancelled") {
      return res.status(400).json({
        message: "Appointment is already cancelled",
        success: false,
      })
    }

    // Check if appointment is within 2 hours (cancellation policy)
    const appointmentDateTime = new Date(`${appointment.appointment_date} ${appointment.appointment_time}`)
    const now = new Date()
    const timeDiff = appointmentDateTime.getTime() - now.getTime()
    const hoursDiff = timeDiff / (1000 * 3600)

    if (hoursDiff < 2) {
      return res.status(400).json({
        message: "Appointments cannot be cancelled less than 2 hours before the scheduled time",
        success: false,
      })
    }

    // Update appointment status
    await db.execute("UPDATE appointments SET status = 'cancelled', updated_at = NOW() WHERE id = ?", [appointmentId])

    res.status(200).json({
      message: "Appointment cancelled successfully",
      success: true,
    })
  } catch (error) {
    console.error("Cancel appointment error:", error)
    res.status(500).json({
      message: "An error occurred while cancelling the appointment",
      success: false,
    })
  }
})

// Get available time slots for a specific date
router.get("/available-slots/:date", async (req, res) => {
  const date = req.params.date

  try {
    // Get booked time slots for the date
    const [bookedSlots] = await db.execute(
      "SELECT appointment_time FROM appointments WHERE appointment_date = ? AND status != 'cancelled'",
      [date],
    )

    // Define available time slots (9 AM to 5 PM, 30-minute intervals)
    const allSlots = []
    for (let hour = 9; hour < 17; hour++) {
      allSlots.push(`${hour.toString().padStart(2, "0")}:00:00`)
      allSlots.push(`${hour.toString().padStart(2, "0")}:30:00`)
    }

    // Filter out booked slots
    const bookedTimes = bookedSlots.map((slot) => slot.appointment_time)
    const availableSlots = allSlots.filter((slot) => !bookedTimes.includes(slot))

    res.status(200).json({
      success: true,
      availableSlots: availableSlots,
      bookedSlots: bookedTimes,
    })
  } catch (error) {
    console.error("Get available slots error:", error)
    res.status(500).json({
      message: "An error occurred while fetching available slots",
      success: false,
    })
  }
})

module.exports = router
