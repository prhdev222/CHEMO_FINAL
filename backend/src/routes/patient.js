const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');
const patientController = require('../controllers/patientController');

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'src/uploads/');
  },
  filename: function (req, file, cb) {
    // Use patient HN and original file name for more clarity
    const safeOriginalName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    const uniqueSuffix = Date.now();
    cb(null, `patient_${req.params.id}_${uniqueSuffix}_${safeOriginalName}`);
  }
});

// Use upload.array() to accept multiple files
const upload = multer({ storage: storage });

// Protect all routes in this file
router.use(authenticateToken);

// CREATE
router.post('/', authorizeRoles('ADMIN', 'DOCTOR', 'NURSE'), patientController.createPatient);

// READ ALL
router.get('/', authorizeRoles('ADMIN', 'DOCTOR', 'NURSE'), patientController.getAllPatients);

// READ BY ID
router.get('/id/:id', patientController.getPatientById);

// UPDATE BY ID
router.put('/id/:id', authorizeRoles('ADMIN', 'DOCTOR', 'NURSE'), upload.array('newAttachments'), patientController.updatePatientById);

// DELETE ATTACHMENT
router.put('/id/:id/delete-attachment', authorizeRoles('ADMIN', 'DOCTOR', 'NURSE'), patientController.deleteAttachment);

// SOFT DELETE
router.delete('/id/:id', authorizeRoles('ADMIN'), patientController.softDeletePatient);

// Search by HN or name - All authenticated users
router.get('/search/:query', authorizeRoles('ADMIN', 'DOCTOR', 'NURSE'), (req, res) => {
  // ... existing code ...
});

module.exports = router; 