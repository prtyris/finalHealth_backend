/**
 * APPOINTMENT CONTROLLER
 *
 * - No try/catch
 * - No audit imports
 * - asyncHandler only
 * - Global error handling
 */

import AppointmentRepo from "../../infrastructure/AppointmentRepo.js";
import PatientRepo from "../../infrastructure/PatientRepo.js";
import PriorityRepo from "../../infrastructure/PriorityRepo.js";
import AppointmentFactory from "../../domain/factories/AppointmentFactory.js";
import AppointmentService from "../../application/services/AppointmentService.js";

import CreateAppointmentDTO from "../http/CreateAppointmentDTO.js";
import RescheduleAppointmentDTO from "../http/RescheduleAppointmentDTO.js";

import DoctorSessionRepo from "../../../clinic_management/infrastructure/DoctorSessionRepo.js";

import { asyncHandler } from "../../../../core/middleware/asyncHandler.js";
import { sendSuccess } from "../../../../core/http/apiResponse.js";

import eventBus from "../../../../core/events/EventBus.js";

// ============================================================
// DEPENDENCY INJECTION (STANDARD)
// ============================================================
const appointmentRepo = new AppointmentRepo();
const patientRepo = new PatientRepo();
const priorityRepo = new PriorityRepo();
const factory = new AppointmentFactory();
const doctorSessionRepo = new DoctorSessionRepo();

const appointmentService = new AppointmentService(
  appointmentRepo,
  patientRepo,
  priorityRepo,
  doctorSessionRepo,
  factory,
  eventBus, // ✅ inject event bus, NOT audit
);

// ============================================================
// CREATE APPOINTMENT
// ============================================================
export const createAppointment = asyncHandler(async (req, res) => {
  const dto = new CreateAppointmentDTO(req.body);

  const appointment = await appointmentService.createAppointment(dto, req.user);

  return sendSuccess(res, {
    statusCode: 201,
    message: "Appointment created successfully",
    data: { appointment },
  });
});

// ============================================================
// RESCHEDULE
// ============================================================
export const rescheduleAppointment = asyncHandler(async (req, res) => {
  const dto = new RescheduleAppointmentDTO(req.body, req.params);

  const appointment = await appointmentService.rescheduleAppointment(
    dto,
    req.user,
  );

  return sendSuccess(res, {
    message: "Appointment rescheduled successfully",
    data: { appointment },
  });
});

// ============================================================
// CANCEL
// ============================================================
export const cancelAppointment = asyncHandler(async (req, res) => {
  const appointmentId = Number(req.params.id);

  const appointment = await appointmentService.cancelAppointment(
    appointmentId,
    req.user,
  );

  return sendSuccess(res, {
    message: "Appointment cancelled successfully",
    data: { appointment },
  });
});

// ============================================================
// COMPLETE
// ============================================================
export const completeAppointment = asyncHandler(async (req, res) => {
  const appointmentId = Number(req.params.id);

  const appointment = await appointmentService.completeAppointment(
    appointmentId,
    req.user,
  );

  return sendSuccess(res, {
    message: "Appointment marked as completed",
    data: { appointment },
  });
});

// ============================================================
// QUERIES
// ============================================================
export const listAppointmentsByDate = asyncHandler(async (req, res) => {
  const clinicId = Number(req.query.clinicId);
  const fromDate = req.query.fromDate;
  const toDate = req.query.toDate;

  const appointments = await appointmentService.listAppointmentsByDateRange(
    clinicId,
    fromDate,
    toDate,
  );

  return sendSuccess(res, { data: { appointments } });
});

export const listAppointmentsByPatient = asyncHandler(async (req, res) => {
  const patientId = Number(req.params.patientId);

  const appointments =
    await appointmentService.listAppointmentsByPatient(patientId);

  return sendSuccess(res, { data: { appointments } });
});

export const getAppointmentById = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);

  const appointment = await appointmentService.getAppointmentById(id);

  return sendSuccess(res, { data: { appointment } });
});

export const listAllAppointmentsForDoctor = asyncHandler(async (req, res) => {
  const doctorId = Number(req.params.doctorId);
  const clinicId = Number(req.params.clinicId);

  const appointments =
    await appointmentService.listAllAppointmentsByDoctorAndClinic(
      doctorId,
      clinicId,
    );

  return sendSuccess(res, { data: { appointments } });
});

export const listTodayAppointments = asyncHandler(async (req, res) => {
  const doctorId = Number(req.params.doctorId);
  const clinicId = Number(req.params.clinicId);

  const appointments = await appointmentService.listTodayAppointments(
    doctorId,
    clinicId,
  );

  return sendSuccess(res, { data: { appointments } });
});

// ============================================================
// New & Planned api calls
// ============================================================
export const getAllAppointmentsOfDoctorInClinic = asyncHandler(
  async (req, res) => {
    const doctorId = Number(req.params.doctorId);
    const clinicId = Number(req.params.clinicId);

    const { allAppointments, todayAppointments } =
      await appointmentService.getAllAppointmentsOfDoctorInClinic(
        doctorId,
        clinicId,
      );

    return sendSuccess(res, {
      message: "Ilovecs",
      data: {
        allAppointments,
        todayAppointments,
      },
    });
  },
);
