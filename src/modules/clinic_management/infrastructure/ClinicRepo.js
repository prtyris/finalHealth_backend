import IClinicRepository from "../domain/repositories/IClinicRepository.js";
import Clinic from "../domain/entities/Clinic.js";
import db from "../../../core/database/db.js";

export default class ClinicRepo extends IClinicRepository {
  /* ============================
     SAVE CLINIC
  ============================ */
  async save(clinic, userId) {
    const query = `
      INSERT INTO clinics 
      (clinic_name, address, contact_num, backup_num, open_hours, open_days,
       business_permit_no, owner_name, profile_image_path, is_verified, verification_status, user_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *;
    `;

    const values = [
      clinic.clinicName,
      clinic.address,
      clinic.contactNum,
      clinic.backupNum,
      clinic.openHours,
      clinic.openDays,
      clinic.businessPermitNo,
      clinic.ownerName,
      clinic.profileImagePath,
      true,
      "Approved",
      userId,
    ];

    const result = await db.query(query, values);
    return this._toEntity(result.rows[0]);
  }

  /* ============================
     FIND BY ID
  ============================ */
  async findById(clinicId) {
    const result = await db.query(`SELECT * FROM clinics WHERE clinic_id=$1`, [
      clinicId,
    ]);

    if (result.rows.length === 0) return null;

    return this._toEntity(result.rows[0]);
  }

  /* ============================
     UPDATE VERIFICATION STATUS
  ============================ */
  async updateVerificationStatus(clinicId, status) {
    const isVerified = status === "Approved";

    const query = `
      UPDATE clinics
      SET verification_status=$1,
          is_verified=$2
      WHERE clinic_id=$3
      RETURNING *;
    `;

    const result = await db.query(query, [status, isVerified, clinicId]);

    return this._toEntity(result.rows[0]);
  }

  /* ============================
     FIND ALL PENDING
  ============================ */
  async findPendingVerification() {
    const result = await db.query(
      `SELECT * FROM clinics WHERE verification_status='Pending'`,
    );

    return result.rows.map((row) => this._toEntity(row));
  }

  async findClinicsByDoctor(doctorId) {
    const query = `
    SELECT c.*
    FROM clinics c
    JOIN doctor_clinics dc ON dc.clinic_id = c.clinic_id
    WHERE dc.doctor_id = $1
    ORDER BY c.clinic_name ASC
  `;

    const result = await db.query(query, [doctorId]);
    return result.rows;
  }

  /* ============================
   GET ALL CLINICS THAT ARE NOT CONNECTED TO A PARTICULAR CLNIC(FULL DATA)
============================ */
  async getAllClinics(userId) {
    const query = `
    SELECT *
    FROM clinics WHERE user_id = $1
    ORDER BY clinic_name ASC;
  `;

    const result = await db.query(query, [userId]);

    return result.rows;
  }

  async findUnassignedClinics(doctorId) {
    const query = `
    SELECT 
      c.*
    FROM clinics c
    WHERE c.clinic_id NOT IN (
      SELECT clinic_id 
      FROM doctor_clinics 
      WHERE doctor_id = $1
    )
    ORDER BY c.clinic_name ASC;
  `;

    const result = await db.query(query, [doctorId]);

    return result.rows.map((row) => this._toEntity(row));
  }

  /* ============================
     PRIVATE: MAP DB → ENTITY
  ============================ */
  _toEntity(row) {
    if (!row) return null;

    return new Clinic.Builder()
      .setClinicId(row.clinic_id)
      .setClinicName(row.clinic_name)
      .setAddress(row.address)
      .setContactNum(row.contact_num)
      .setBackupNum(row.backup_num)
      .setOpenHours(row.open_hours)
      .setOpenDays(row.open_days)
      .setBusinessPermitNo(row.business_permit_no)
      .setOwnerName(row.owner_name)
      .setDateRegistered(row.date_registered)
      .setProfileImagePath(row.profile_image_path)
      .setIsVerified(row.is_verified)
      .setVerificationStatus(row.verification_status)
      .setCreatedAt(row.created_at)
      .build();
  }

  // ============================================================
  // New & Planned api calls
  // ============================================================
  async getAllClinicsOfDoctor(doctorId, userId) {
    const query = `
SELECT
  c.*,
  dc.doctor_id,
  dc.clinic_id AS linked_clinic_id
FROM clinics c
JOIN doctor_clinics dc ON c.clinic_id = dc.clinic_id
WHERE dc.doctor_id = $1
  AND c.user_id = $2
  AND c.is_verified = TRUE
  AND c.verification_status = 'Approved';


  `;

    const result = await db.query(query, [doctorId, userId]);
    return result.rows;
  }
  async getAllClinicsOfUserNotAffiliated(doctorId, userId) {
    const query = `
    SELECT c.*
    FROM clinics c
    WHERE c.user_id = $1
      AND c.is_verified = TRUE
      AND c.verification_status = 'Approved'
      AND NOT EXISTS (
        SELECT 1
        FROM doctor_clinics dc
        WHERE dc.clinic_id = c.clinic_id
          AND dc.doctor_id = $2
      );
  `;

    const result = await db.query(query, [userId, doctorId]);
    return result.rows;
  }
  async getClinicSessions(clinicId) {
    const query = `
    SELECT
      clinic_schedule_id,
      clinic_id,
      day_of_week,

      -- Standardized time (AM/PM)
      TO_CHAR(open_time, 'HH12:MI AM') AS open_time,
      TO_CHAR(close_time, 'HH12:MI AM') AS close_time,

      -- Session classification
      CASE
        WHEN open_time < TIME '12:00'
             AND close_time > TIME '12:00'
          THEN 'Whole Day'
        WHEN open_time < TIME '12:00'
          THEN 'Morning'
        ELSE 'Afternoon'
      END AS session_period,

      created_at
    FROM clinic_schedules
    WHERE clinic_id = $1
    ORDER BY
      CASE day_of_week
        WHEN 'Monday' THEN 1
        WHEN 'Tuesday' THEN 2
        WHEN 'Wednesday' THEN 3
        WHEN 'Thursday' THEN 4
        WHEN 'Friday' THEN 5
        WHEN 'Saturday' THEN 6
        WHEN 'Sunday' THEN 7
      END,
      open_time;
  `;

    const result = await db.query(query, [clinicId]);
    return result.rows;
  }

  async createAffiliationDoctorToClinic(doctorId, clinicId) {
    const query = `
      INSERT INTO doctor_clinics (doctor_id, clinic_id)
      VALUES ($1, $2)
      ON CONFLICT (doctor_id, clinic_id)
      DO NOTHING
      RETURNING doctor_id, clinic_id;
    `;

    const { rows } = await db.query(query, [doctorId, clinicId]);

    // If rows.length === 0, affiliation already exists
    return rows[0] || null;
  }

  // async createClinicSession(clinicId, sessionData) {
  //   const query = `
  //   INSERT INTO clinic_schedules (
  //     clinic_id,
  //     day_of_week,
  //     open_time,
  //     close_time
  //   )
  //   VALUES ($1, $2, $3, $4)
  //   RETURNING
  //     clinic_schedule_id,
  //     clinic_id,
  //     day_of_week,
  //     open_time,
  //     close_time,
  //     created_at;
  // `;

  //   const { rows } = await db.query(query, [
  //     clinicId,
  //     sessionData.day_of_week,
  //     sessionData.open_time,
  //     sessionData.close_time,
  //   ]);

  //   return rows[0];
  // }

  async createClinicSession(clinicId, sessionData) {
    const { day_of_week, open_time, close_time } = sessionData;

    // 1️⃣ Basic Time Validation
    if (!open_time || !close_time) {
      throw new Error("Open time and close time are required.");
    }

    if (open_time >= close_time) {
      throw new Error("Open time must be earlier than close time.");
    }

    // 2️⃣ Check for overlapping sessions
    const overlapCheckQuery = `
    SELECT 1
    FROM clinic_schedules
    WHERE clinic_id = $1
      AND day_of_week = $2
      AND (
        ($3 < close_time AND $4 > open_time)
      )
    LIMIT 1;
  `;

    const overlapResult = await db.query(overlapCheckQuery, [
      clinicId,
      day_of_week,
      open_time,
      close_time,
    ]);

    if (overlapResult.rows.length > 0) {
      throw new Error("This schedule overlaps with an existing session.");
    }

    // 3️⃣ Insert if valid
    const query = `
    INSERT INTO clinic_schedules (
      clinic_id,
      day_of_week,
      open_time,
      close_time
    )
    VALUES ($1, $2, $3, $4)
    RETURNING
      clinic_schedule_id,
      clinic_id,
      day_of_week,
      open_time,
      close_time,
      created_at;
  `;

    const { rows } = await db.query(query, [
      clinicId,
      day_of_week,
      open_time,
      close_time,
    ]);

    return rows[0];
  }

  async cancelByDoctorAndClinic(doctorId, clinicId, trx) {
    const query = `
    UPDATE appointments
    SET status = 'Cancelled'
    WHERE doctor_id = $1
      AND clinic_id = $2
      AND status IN ('Scheduled')
  `;

    await trx.query(query, [doctorId, clinicId]);
  }

  async deleteByDoctorAndClinic(doctorId, clinicId, trx) {
    const query = `
    DELETE FROM doctor_sessions
    WHERE doctor_id = $1
      AND clinic_id = $2
  `;

    await trx.query(query, [doctorId, clinicId]);
  }

  async delete(doctorId, clinicId, trx) {
    const query = `
    DELETE FROM doctor_clinics
    WHERE doctor_id = $1
      AND clinic_id = $2
  `;

    const result = await trx.query(query, [doctorId, clinicId]);

    if (result.rowCount === 0) {
      throw new Error("Doctor is not affiliated with this clinic");
    }
  }

  async getClinicInfo(clinicId) {
    const query = `
    SELECT *
    FROM clinics
    WHERE clinic_id = $1;
  `;

    const result = await db.query(query, [clinicId]);
    return result.rows;
  }

  async updateClinicInfo(clinicId, data) {
    const query = `
    UPDATE clinics
    SET
      clinic_name        = COALESCE($1, clinic_name),
      address            = COALESCE($2, address),
      contact_num        = COALESCE($3, contact_num),
      backup_num         = COALESCE($4, backup_num),
      open_hours         = COALESCE($5, open_hours),
      open_days          = COALESCE($6, open_days),
      business_permit_no = COALESCE($7, business_permit_no),
      owner_name         = COALESCE($8, owner_name),
      profile_image_path = COALESCE($9, profile_image_path)
    WHERE clinic_id = $10
    RETURNING *;
  `;

    const values = [
      data.clinic_name ?? null,
      data.address ?? null,
      data.contact_num ?? null,
      data.backup_num ?? null,
      data.open_hours ?? null,
      data.open_days ?? null,
      data.business_permit_no ?? null,
      data.owner_name ?? null,
      data.profile_image_path ?? null,
      clinicId,
    ];

    const { rows } = await db.query(query, values);
    return rows[0];
  }

  async getClinicSessionById(sessionId, trx) {
    const query = `
    SELECT
      clinic_schedule_id,
      clinic_id,
      day_of_week,
      open_time,
      close_time
    FROM clinic_schedules
    WHERE clinic_schedule_id = $1;
  `;

    const result = await trx.query(query, [sessionId]);
    return result.rows[0] || null;
  }

  async deleteDoctorSessionsByClinicSchedule(schedule, trx) {
    const query = `
    DELETE FROM doctor_sessions
    WHERE clinic_id = $1
      AND day_of_week = $2;
  `;

    await trx.query(query, [schedule.clinic_id, schedule.day_of_week]);
  }

  async deleteClinicSessionById(sessionId, trx) {
    const query = `
    DELETE FROM clinic_schedules
    WHERE clinic_schedule_id = $1;
  `;

    await trx.query(query, [sessionId]);
  }

  async cancelAppointmentsByClinic(schedule, trx) {
    const query = `
    UPDATE appointments
    SET status = 'Cancelled'
    WHERE clinic_id = $1
      AND status = 'Scheduled'
      AND appointment_date >= CURRENT_DATE;
  `;

    await trx.query(query, [schedule.clinic_id]);
  }
}
