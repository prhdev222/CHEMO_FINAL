const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');
const appointmentController = require('../controllers/appointmentController');

// Protect all routes in this file
router.use(authenticateToken);

// GET all appointments
router.get('/', authorizeRoles('ADMIN', 'DOCTOR', 'NURSE'), appointmentController.getAllAppointments);

// GET available statuses (ต้องอยู่เหนือ /:id)
router.get('/statuses', authorizeRoles('ADMIN', 'DOCTOR', 'NURSE'), appointmentController.getAvailableStatuses);

// POST create appointment
router.post('/', authorizeRoles('ADMIN', 'DOCTOR', 'NURSE'), appointmentController.createAppointment);

// PUT update appointment
router.put('/:id', authorizeRoles('ADMIN', 'DOCTOR', 'NURSE'), appointmentController.updateAppointment);

// DELETE appointment
router.delete('/:id', authorizeRoles('ADMIN'), appointmentController.deleteAppointment);

// PATCH update status
router.patch('/:id/status', authorizeRoles('ADMIN', 'DOCTOR', 'NURSE'), appointmentController.updateAppointmentStatus);

// POST เลื่อนนัดหมาย
router.post('/:id/reschedule', authorizeRoles('ADMIN', 'DOCTOR', 'NURSE'), appointmentController.rescheduleAppointment);

// POST ยกเลิกนัดหมาย
router.post('/:id/cancel', authorizeRoles('ADMIN', 'DOCTOR', 'NURSE'), appointmentController.cancelAppointment);

// POST บันทึกประวัติการเลื่อนนัด/ยกเลิกนัด
router.post('/:id/reschedule-history', authorizeRoles('ADMIN', 'DOCTOR', 'NURSE'), appointmentController.addRescheduleHistory);

// GET ดึงประวัติการเลื่อนนัด/ยกเลิกนัด
router.get('/:id/reschedule-history', authorizeRoles('ADMIN', 'DOCTOR', 'NURSE'), appointmentController.getRescheduleHistory);

module.exports = router; 