const prisma = require('../middlewares/prisma');

exports.getAllAppointments = async (req, res) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { isDeleted: false },
      include: { patient: true },
      orderBy: { date: 'asc' }
    });
    res.json(appointments);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.createAppointment = async (req, res) => {
  try {
    const data = req.body;
    const patient = await prisma.patient.findUnique({ where: { id: Number(data.patientId) } });
    if (!patient) {
      return res.status(400).json({ error: 'patientId ไม่ถูกต้อง หรือไม่มีในฐานข้อมูล' });
    }
    const appointment = await prisma.appointment.create({
      data: {
        patientId: Number(data.patientId),
        date: new Date(data.date),
        chemoRegimen: data.chemoRegimen,
        admitStatus: data.admitStatus,
        admitDate: data.admitDate ? new Date(data.admitDate) : undefined,
        dischargeDate: data.dischargeDate ? new Date(data.dischargeDate) : undefined,
        referHospital: data.referHospital || undefined,
        referDate: data.referDate ? new Date(data.referDate) : undefined,
        note: data.note || undefined,
      }
    });
    res.json(appointment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    if (data.date) data.date = new Date(data.date);
    if (data.referDate) data.referDate = new Date(data.referDate);
    const appointment = await prisma.appointment.update({
      where: { id: Number(id) },
      data
    });
    res.json(appointment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.appointment.update({
      where: { id: Number(id) },
      data: { isDeleted: true }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { admitStatus, admitDate, dischargeDate, note } = req.body;
    
    // ดึง appointment เดิม
    const appointment = await prisma.appointment.findUnique({ where: { id: Number(id) } });
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    // ป้องกันการเปลี่ยนสถานะผิด logic
    if (appointment.admitStatus === 'discharged' && admitStatus === 'admit') {
      return res.status(400).json({ error: 'ไม่สามารถเปลี่ยน discharged กลับเป็น admit ได้ กรุณาสร้าง appointment ใหม่สำหรับ admit รอบใหม่' });
    }
    if (appointment.admitStatus === 'admit' && admitStatus === 'admit') {
      return res.status(400).json({ error: 'Appointment นี้เป็น admit อยู่แล้ว' });
    }
    
    // อัปเดตข้อมูล
    const updateData = {
      admitStatus,
      note: note || undefined,
    };
    
    // เพิ่ม admitDate ถ้าเป็น admit
    if (admitStatus === 'admit') {
      updateData.admitDate = admitDate ? new Date(admitDate) : new Date();
    }
    
    // เพิ่ม dischargeDate ถ้าเป็น discharged
    if (admitStatus === 'discharged') {
      updateData.dischargeDate = dischargeDate ? new Date(dischargeDate) : new Date();
    }
    
    const updated = await prisma.appointment.update({
      where: { id: Number(id) },
      data: updateData
    });
    
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ฟังก์ชันสำหรับเลื่อนนัดหมาย
exports.rescheduleAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { newDate, note } = req.body;
    
    if (!newDate) {
      return res.status(400).json({ error: 'วันที่นัดใหม่จำเป็นต้องระบุ' });
    }
    
    // ดึง appointment เดิม
    const appointment = await prisma.appointment.findUnique({ where: { id: Number(id) } });
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    // บันทึกประวัติการเลื่อนนัด
    await prisma.rescheduleHistory.create({
      data: {
        appointmentId: Number(id),
        action: 'reschedule',
        date: new Date(),
        newDate: new Date(newDate),
        note,
        createdBy: req.user?.name || 'System',
      }
    });
    
    // อัปเดต appointment
    const updated = await prisma.appointment.update({
      where: { id: Number(id) },
      data: {
        date: new Date(newDate),
        admitStatus: 'rescheduled',
        note: note || undefined,
      }
    });
    
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ฟังก์ชันสำหรับยกเลิกนัดหมาย
exports.cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    
    // ดึง appointment เดิม
    const appointment = await prisma.appointment.findUnique({ where: { id: Number(id) } });
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    // บันทึกประวัติการยกเลิกนัด
    await prisma.rescheduleHistory.create({
      data: {
        appointmentId: Number(id),
        action: 'cancel',
        date: new Date(),
        note,
        createdBy: req.user?.name || 'System',
      }
    });
    
    // อัปเดต appointment
    const updated = await prisma.appointment.update({
      where: { id: Number(id) },
      data: {
        admitStatus: 'cancelled',
        note: note || undefined,
      }
    });
    
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// เพิ่มฟังก์ชันบันทึกประวัติการเลื่อนนัด/ยกเลิกนัด
exports.addRescheduleHistory = async (req, res) => {
  try {
    const { appointmentId, action, date, newDate, note, createdBy } = req.body;
    if (!appointmentId || !action || !date) {
      return res.status(400).json({ error: 'appointmentId, action, date จำเป็นต้องระบุ' });
    }
    const history = await prisma.rescheduleHistory.create({
      data: {
        appointmentId: Number(appointmentId),
        action,
        date: new Date(date),
        newDate: newDate ? new Date(newDate) : undefined,
        note,
        createdBy,
      }
    });
    res.json(history);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ดึงประวัติการเลื่อนนัด/ยกเลิกนัดของ appointment
exports.getRescheduleHistory = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const history = await prisma.rescheduleHistory.findMany({
      where: { appointmentId: Number(appointmentId) },
      orderBy: { date: 'asc' }
    });
    res.json(history);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ดึงสถานะทั้งหมดที่มีใน appointment และ action ใน rescheduleHistory
exports.getAvailableStatuses = async (req, res) => {
  try {
    // ดึง admitStatus ที่มีใน appointment
    const statuses = await prisma.appointment.findMany({
      select: { admitStatus: true },
      distinct: ['admitStatus']
    });
    // ดึง action ที่มีใน rescheduleHistory
    const actions = await prisma.rescheduleHistory.findMany({
      select: { action: true },
      distinct: ['action']
    });
    // รวมและแปลงเป็น array ไม่ซ้ำ
    const statusSet = new Set([
      ...statuses.map(s => s.admitStatus),
      ...actions.map(a => a.action)
    ]);
    res.json(Array.from(statusSet));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}; 