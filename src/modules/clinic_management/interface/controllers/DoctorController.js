import DoctorRepo from "../../infrastructure/DoctorRepo.js";
import ClinicRepo from "../../infrastructure/ClinicRepo.js";
import DoctorFactory from "../../domain/factories/DoctorFactory.js";

import DoctorManagementService from "../../application/services/DoctorManagementService.js";

import RegisterDoctorDTO from "../http/dtos/RegisterDoctorDTO.js";

import { asyncHandler } from "../../../../core/middleware/asyncHandler.js";
import { sendSuccess } from "../../../../core/http/apiResponse.js";

import eventBus from "../../../../core/events/EventBus.js";

// Instantiate dependencies
const doctorRepo = new DoctorRepo();
const clinicRepo = new ClinicRepo();
const factory = new DoctorFactory();

const doctorService = new DoctorManagementService(
  doctorRepo,
  clinicRepo,
  factory,
  eventBus,
);

export const registerDoctor = async (req, res) => {
  try {
    const dto = new RegisterDoctorDTO(req.body);

    const doctor = await doctorService.registerDoctor(dto, req.user);

    res.status(201).json({ success: true, doctor });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

export const approveDoctor = async (req, res) => {
  try {
    const doctorId = Number(req.params.id);

    await doctorService.approveDoctor(doctorId, req.user);

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

export const rejectDoctor = async (req, res) => {
  try {
    const doctorId = Number(req.params.id);
    const { reason } = req.body;

    await doctorService.rejectDoctor(doctorId, req.user, reason);

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

export const assignDoctorToClinic = async (req, res) => {
  try {
    const { doctorId, clinicId } = req.body;

    await doctorService.assignDoctorToClinic(doctorId, clinicId, req.user);

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

export const getDoctors = async (req, res) => {
  try {
    const clinicId = req.query.clinic_id ? Number(req.query.clinic_id) : null;

    const doctors = await doctorService.getDoctors(clinicId);

    res.status(200).json({ success: true, doctors });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

export const getClinicsOfDoctor = async (req, res) => {
  try {
    const doctorId = Number(req.params.doctorId);

    const clinics = await doctorService.getClinicsOfDoctor(doctorId);

    res.status(200).json({
      success: true,
      clinics,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
};

// ============================================================
// New & Planned api calls
// ============================================================
export const getAllApprovedDoctorsOfUser = async (req, res) => {
  try {
    const doctors = await doctorService.getAllApprovedDoctorsOfUser(
      req.user.id,
    );
    res.status(200).json({
      success: true,
      data: doctors,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
};
export const getAllDoctorsOfUser = async (req, res) => {
  try {
    const doctors = await doctorService.getAllDoctorsOfUser(req.user.id);
    res.status(200).json({
      success: true,
      data: doctors,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
};

export const getAllInfoOfDoctor = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;

    const doctors = await doctorService.getAllInfoOfDoctor(
      doctorId,
      req.user.id,
    );
    res.status(200).json({
      success: true,
      data: doctors,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
};

export const updateDoctorInfo = asyncHandler(async (req, res) => {
  const sessions = await doctorService.updateDoctorInfo(
    Number(req.params.doctorId),
    req.body,
  );

  return sendSuccess(res, {
    data: { sessions },
  });
});
