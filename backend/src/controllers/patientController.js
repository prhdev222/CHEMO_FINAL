const prisma = require('../middlewares/prisma');
const path = require('path');

// CREATE - Admin, Doctor, Nurse
exports.createPatient = async (req, res) => {
  try {
    const { hn, firstName, lastName, birthDate, phone, lineId, address, status } = req.body;
    if (!hn || !firstName || !lastName || !birthDate) {
      return res.status(400).json({ error: "HN, First Name, Last Name, and Birth Date are required." });
    }
    const patient = await prisma.patient.create({
      data: {
        hn,
        firstName,
        lastName,
        birthDate: new Date(birthDate),
        phone,
        lineId,
        address,
        status: status || 'ACTIVE',
        treatmentPlan: {},
      }
    });
    res.status(201).json(patient);
  } catch (err) {
    console.error(err);
    if (err.code === 'P2002') {
      return res.status(409).json({ error: `Patient with HN ${req.body.hn} already exists.` });
    }
    res.status(400).json({ error: "Could not create patient." });
  }
};

// READ All - All authenticated users
exports.getAllPatients = async (req, res) => {
  try {
    const patients = await prisma.patient.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: 'desc' }
    });
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch patients." });
  }
};

// READ by ID
exports.getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await prisma.patient.findUnique({ where: { id: parseInt(id) } });
    if (!patient || patient.isDeleted) {
      return res.status(404).json({ error: "Patient not found" });
    }
    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch patient." });
  }
};

// UPDATE by ID - Now handles multiple file uploads
exports.updatePatientById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const patient = await prisma.patient.findUnique({ where: { id: parseInt(id) } });
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }
    let existingAttachments = [];
    if (patient.attachments && Array.isArray(patient.attachments)) {
      existingAttachments = patient.attachments;
    }
    if (req.files && req.files.length > 0) {
      const attachmentNames = req.body.attachmentNames ? JSON.parse(req.body.attachmentNames) : [];
      const newAttachments = req.files.map((file, index) => ({
        name: attachmentNames[index] || file.originalname,
        path: `uploads/${file.filename}`
      }));
      existingAttachments.push(...newAttachments);
    }
    data.attachments = existingAttachments;
    if (data.birthDate) data.birthDate = new Date(data.birthDate);
    if (data.diagnosisDate) data.diagnosisDate = new Date(data.diagnosisDate);
    if (data.treatmentPlan && typeof data.treatmentPlan === 'string') {
      data.treatmentPlan = JSON.parse(data.treatmentPlan);
    }
    if (data.followUp && typeof data.followUp === 'string') {
      data.followUp = JSON.parse(data.followUp);
    }
    delete data.newAttachments;
    delete data.attachmentNames;
    const updatedPatient = await prisma.patient.update({
      where: { id: parseInt(id) },
      data
    });
    res.json(updatedPatient);
  } catch (err) {
    console.error("Update error:", err);
    res.status(400).json({ error: "Could not update patient." });
  }
};

// DELETE an attachment
exports.deleteAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    const { attachmentPath } = req.body;
    if (!attachmentPath) {
      return res.status(400).json({ error: "Attachment path is required." });
    }
    const patient = await prisma.patient.findUnique({ where: { id: parseInt(id) } });
    if (!patient || !patient.attachments || !Array.isArray(patient.attachments)) {
      return res.status(404).json({ error: "Patient or attachments not found." });
    }
    const updatedAttachments = patient.attachments.filter(att => att.path !== attachmentPath);
    // (Optional) ลบไฟล์จริงออกจาก server
    // const fs = require('fs');
    // fs.unlink(path.join(__dirname, '..', attachmentPath), (err) => {
    //   if (err) console.error("Error deleting file:", err);
    // });
    const updatedPatient = await prisma.patient.update({
      where: { id: parseInt(id) },
      data: { attachments: updatedAttachments }
    });
    res.json(updatedPatient);
  } catch (err) {
    console.error("Delete attachment error:", err);
    res.status(500).json({ error: "Could not delete attachment." });
  }
};

// SOFT DELETE by ID - Admin only
exports.softDeletePatient = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.patient.update({
      where: { id: parseInt(id) },
      data: { isDeleted: true }
    });
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: "Could not delete patient." });
  }
}; 