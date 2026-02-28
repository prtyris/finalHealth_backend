import express from "express";

const router = express.Router();

import {
  getPatientOfDoctorInClinic,
  getPatientInfo,
  getPatientMedicalRecords,
  getMedicalRecordsFullDetails,
  uploadMedicalRecordDocuments,
  createMedicalRecord,
} from "../controllers/MedController.js";

import { requireUser } from "../../../../core/middleware/requireUser.js";
import authMiddleware from "../../../../core/middleware/Auth.js";
import requireActiveSubscription from "../../../../core/middleware/RequireActiveSubscription.js";

router.get(
  "/doctor/:doctorId/clinic/:clinicId/patients",
  authMiddleware,
  requireUser,
  getPatientOfDoctorInClinic,
);

router.get(
  "/patient/:patientId/patient-info",
  authMiddleware,
  requireUser,
  getPatientInfo,
);

router.get(
  "/patient/:patientId/patient-med-rec",
  authMiddleware,
  requireUser,
  getPatientMedicalRecords,
);

router.get(
  "/record/:recordId/patient-med-rec-detail",
  authMiddleware,
  requireUser,
  getMedicalRecordsFullDetails,
);

router.post(
  "/:recordId/documents",
  authMiddleware,
  requireUser,
  uploadMedicalRecordDocuments,
);

router.post(
  "/patient/:patientId/medical-records",
  authMiddleware,
  requireActiveSubscription,
  requireUser,
  createMedicalRecord,
);

export default router;
