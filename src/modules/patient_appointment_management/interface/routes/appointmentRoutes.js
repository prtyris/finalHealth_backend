import express from "express";

import db from "../../../../core/database/db.js";

import {
  createAppointment,
  rescheduleAppointment,
  cancelAppointment,
  completeAppointment,
  listAppointmentsByDate,
  listAppointmentsByPatient,
  getAppointmentById,
  listAllAppointmentsForDoctor,
  listTodayAppointments,
  getAllAppointmentsOfDoctorInClinic,
} from "../controllers/AppointmentController.js";

// Importing authMiddleware
import authMiddleware from "../../../../core/middleware/Auth.js";
import requireActiveSubscription from "../../../../core/middleware/RequireActiveSubscription.js";

import { requireUser } from "../../../../core/middleware/requireUser.js";
const router = express.Router();

router.get("/doctor/:doctorId/clinic/:clinicId/today", listTodayAppointments);

router.get("/appointment/:id", getAppointmentById);
// router.get("/", listAppointmentsByDate);

router.post(
  "/",
  authMiddleware,
  requireActiveSubscription,
  requireUser,
  createAppointment,
);

router.put(
  "/appointment/:id/reschedule",
  authMiddleware,
  requireUser,
  rescheduleAppointment,
);

router.put(
  "/appointment/:id/cancel",
  authMiddleware,
  requireUser,
  cancelAppointment,
);

router.put(
  "/appointment/:id/complete",
  authMiddleware,
  requireUser,
  completeAppointment,
);

router.get(
  "/patient/:patientId",
  authMiddleware,
  requireUser,
  listAppointmentsByPatient,
);

router.get(
  "/doctor/:doctorId/clinic/:clinicId",
  authMiddleware,
  requireUser,
  listAllAppointmentsForDoctor,
);

// Route to update the appointment status
router.put("/appointment/:appointmentId/status", async (req, res) => {
  const { appointmentId } = req.params;
  const { status } = req.body;

  try {
    if (!status || !appointmentId) {
      return res
        .status(400)
        .json({ message: "Missing status or appointment ID." });
    }

    // Update appointment status in the appointments table
    const query = `
      UPDATE appointments
      SET status = $1
      WHERE appointment_id = $2
      RETURNING *;
    `;
    const values = [status, appointmentId];

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    res.status(200).json({
      message: "Appointment status updated successfully.",
      appointment: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating appointment status:", error);
    res
      .status(500)
      .json({ message: "Server error while updating appointment status." });
  }
});

// ============================================================
// New & Planned api calls
// ============================================================
router.get(
  "/doctor/:doctorId/clinic/:clinicId/appointments",
  authMiddleware,
  requireUser,
  getAllAppointmentsOfDoctorInClinic,
);
export default router;
