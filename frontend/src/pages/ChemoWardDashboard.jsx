import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { FiLink , FiCalendar, FiEdit, FiBell } from 'react-icons/fi';
import { FaBed, FaBan } from 'react-icons/fa';
import '../styles/dashboard.css';
import '../styles/common.css';

// I will reuse the existing Modal component from the original file if it exists,
// assuming it's still needed for rescheduling.
const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h4>{title}</h4>
                    <button onClick={onClose} className="modal-close-btn">&times;</button>
                </div>
                <div className="modal-body">{children}</div>
            </div>
        </div>
    );
};

export default function ChemoWardDashboard() {
    const { token } = useContext(AuthContext);
    const [appointments, setAppointments] = useState([]);
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [newDate, setNewDate] = useState('');
    const [rescheduleNote, setRescheduleNote] = useState('');
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [cancelNote, setCancelNote] = useState('');
    // สำหรับ admit/cancel retroactive
    const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
    const [admitDate, setAdmitDate] = useState('');
    const [isCancelDateModalOpen, setIsCancelDateModalOpen] = useState(false);
    const [cancelDate, setCancelDate] = useState('');
    // สำหรับ discharge retroactive
    const [isDischargeModalOpen, setIsDischargeModalOpen] = useState(false);
    const [dischargeDate, setDischargeDate] = useState('');

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [appointmentsRes, linksRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/api/appointments`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${import.meta.env.VITE_API_URL}/api/links`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (!appointmentsRes.ok || !linksRes.ok) {
                throw new Error('Failed to fetch data');
            }

            const appointmentsData = await appointmentsRes.json();
            const linksData = await linksRes.json();
            
            setAppointments(appointmentsData);
            setLinks(linksData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        if (token) {
            fetchDashboardData();
        }
    }, [token]);

    const handleUpdateStatus = async (id, status, dateOverride) => {
        try {
            const body = { admitStatus: status };
            if (status === 'admit') {
                body.admitDate = dateOverride || new Date().toISOString();
            } else if (status === 'discharged') {
                body.dischargeDate = dateOverride || new Date().toISOString();
            } else if (status === 'canceled') {
                body.cancelDate = dateOverride || new Date().toISOString();
            }

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/appointments/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to update status');
            }
            fetchDashboardData(); // Refresh data
        } catch (err) {
            setError(err.message);
        }
    };

    const handleReschedule = (appointment) => {
        setSelectedAppointment(appointment);
        setIsModalOpen(true);
        setRescheduleNote('');
        const today = new Date().toISOString().split('T')[0];
        setNewDate(today);
    };

    const handleCancel = (appointment) => {
        setSelectedAppointment(appointment);
        setCancelNote('');
        setIsCancelModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedAppointment(null);
        setNewDate('');
        setRescheduleNote('');
    };

    const handleConfirmReschedule = async () => {
        if (!selectedAppointment || !newDate) return;
        try {
            // 1. update appointment date
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/appointments/${selectedAppointment.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ date: newDate, admitStatus: 'waiting' }),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to reschedule');
            }
            // 2. save reschedule history
            await fetch(`${import.meta.env.VITE_API_URL}/api/appointments/${selectedAppointment.id}/reschedule-history`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    appointmentId: selectedAppointment.id,
                    action: 'reschedule',
                    date: new Date().toISOString(),
                    newDate,
                    note: rescheduleNote,
                    createdBy: null
                })
            });
            handleCloseModal();
            fetchDashboardData();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleConfirmCancel = async () => {
        if (!selectedAppointment) return;
        try {
            // 1. update appointment status (discharged/canceled)
            await fetch(`${import.meta.env.VITE_API_URL}/api/appointments/${selectedAppointment.id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ admitStatus: 'canceled' }),
            });
            // 2. save cancel history
            await fetch(`${import.meta.env.VITE_API_URL}/api/appointments/${selectedAppointment.id}/reschedule-history`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    appointmentId: selectedAppointment.id,
                    action: 'cancel',
                    date: new Date().toISOString(),
                    note: cancelNote,
                    createdBy: null
                })
            });
            setIsCancelModalOpen(false);
            setSelectedAppointment(null);
            fetchDashboardData();
        } catch (err) {
            setError(err.message);
        }
    };

    // Modal สำหรับ Admit retroactive
    const handleAdmit = (appointment) => {
        setSelectedAppointment(appointment);
        setAdmitDate(new Date().toISOString().split('T')[0]);
        setIsAdmitModalOpen(true);
    };
    const handleConfirmAdmit = () => {
        if (!selectedAppointment) return;
        handleUpdateStatus(selectedAppointment.id, 'admit', admitDate + 'T00:00:00.000Z');
        setIsAdmitModalOpen(false);
        setSelectedAppointment(null);
    };
    const handleCancelAdmitModal = () => {
        setIsAdmitModalOpen(false);
        setSelectedAppointment(null);
    };

    // Modal สำหรับ Cancel retroactive
    const handleCancelWithDate = (appointment) => {
        setSelectedAppointment(appointment);
        setCancelDate(new Date().toISOString().split('T')[0]);
        setIsCancelDateModalOpen(true);
    };
    const handleConfirmCancelWithDate = () => {
        if (!selectedAppointment) return;
        handleUpdateStatus(selectedAppointment.id, 'canceled', cancelDate + 'T00:00:00.000Z');
        setIsCancelDateModalOpen(false);
        setSelectedAppointment(null);
    };
    const handleCancelCancelModal = () => {
        setIsCancelDateModalOpen(false);
        setSelectedAppointment(null);
    };

    // Modal สำหรับ Discharge retroactive
    const handleDischarge = (appointment) => {
        setSelectedAppointment(appointment);
        setDischargeDate(new Date().toISOString().split('T')[0]);
        setIsDischargeModalOpen(true);
    };
    const handleConfirmDischarge = () => {
        if (!selectedAppointment) return;
        handleUpdateStatus(selectedAppointment.id, 'discharged', dischargeDate + 'T00:00:00.000Z');
        setIsDischargeModalOpen(false);
        setSelectedAppointment(null);
    };
    const handleCancelDischargeModal = () => {
        setIsDischargeModalOpen(false);
        setSelectedAppointment(null);
    };

    if (loading) return <p>Loading dashboard...</p>;
    if (error) return <p>Error: {error}</p>;

    const today = new Date();
    const waitingAppointments = appointments.filter(a => a.admitStatus === 'waiting');
    const admittedPatients = appointments.filter(a => a.admitStatus === 'admit');

    return (
        <div className="dashboard-grid-original">
            <div className="main-column">
                <div className="content-card">
                    <div className="card-header">
                        <div className="card-title"><FiCalendar /><h3>รอเข้ารับการรักษา ({waitingAppointments.length})</h3></div>
                    </div>
                    <div className="card-body list-body">
                        {waitingAppointments.length > 0 ? waitingAppointments.map(app => {
                            const appointmentDate = new Date(app.date);
                            today.setHours(0,0,0,0);
                            appointmentDate.setHours(0,0,0,0);
                            const isDue = appointmentDate <= today;
                            return (
                                <div key={app.id} className="list-item">
                                    <p><strong>{app.patient.firstName} {app.patient.lastName}</strong> (HN: {app.patient.hn})</p>
                                    <p>เบอร์โทร: {app.patient.phone || '-'}</p>
                                    <p>นัด: {appointmentDate.toLocaleDateString('th-TH')} | Regimen: {app.chemoRegimen}</p>
                                    {isDue && <span style={{color: 'red', fontWeight: 'bold'}}><FiBell style={{verticalAlign: 'middle', marginRight: 4}}/>ถึงวันนัดแล้ว!</span>}
                                    <div className="button-group">
                                        <button className="btn-action-sm btn-success" onClick={() => handleAdmit(app)}>Check-in</button>
                                        <button className="btn-action-sm btn-secondary" onClick={() => handleReschedule(app)}>เลื่อนนัด</button>
                                        <button className="btn-action-sm btn-danger" onClick={() => handleCancelWithDate(app)}><FaBan style={{marginRight: 4}}/>Cancel</button>
                                    </div>
                                    {app.admitStatus === 'missed' && <span className="status-missed"> MISSED</span>}
                                </div>
                            );
                        }) : <p>ไม่มีผู้ป่วยรอเข้ารับการรักษา</p>}
                    </div>
                </div>

                <div className="content-card">
                    <div className="card-header">
                        <div className="card-title"><FaBed /><h3>กำลังรักษาตัวในหอผู้ป่วย ({admittedPatients.length})</h3></div>
                    </div>
                    <div className="card-body list-body">
                        {admittedPatients.length > 0 ? admittedPatients.map(app => (
                             <div key={app.id} className="list-item">
                                <span><strong>{app.patient.firstName} {app.patient.lastName}</strong> (HN: {app.patient.hn}) - Admit: {new Date(app.admitDate).toLocaleString('th-TH')}</span>
                                <button className="btn-action-sm btn-danger" onClick={() => handleDischarge(app)}>Discharge</button>
                            </div>
                        )) : <p>ไม่มีผู้ป่วยกำลังรักษาตัว</p>}
                    </div>
                </div>
            </div>

            <div className="side-column">
                 <div className="content-card">
                    <div className="card-header">
                        <div className="card-title"><FiLink /><h3>Links เอกสาร</h3></div>
                        <button className="card-action-icon"><FiEdit /></button>
                    </div>
                    <div className="card-body">
                        {links.length > 0 ? links.map(link => (
                            <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="link-item">{link.title}</a>
                        )) : <p>ยังไม่มีลิงก์</p>}
                    </div>
                </div>
            </div>

             <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="เลื่อนนัดผู้ป่วย">
                <div className="reschedule-form">
                    <p>เลื่อนนัดสำหรับ: <strong>{selectedAppointment?.patient.firstName}</strong></p>
                    <label htmlFor="newDate">วันที่นัดใหม่:</label>
                    <input type="date" id="newDate" value={newDate} onChange={e => setNewDate(e.target.value)} />
                    <label htmlFor="rescheduleNote">หมายเหตุ (ถ้ามี):</label>
                    <textarea id="rescheduleNote" value={rescheduleNote} onChange={e => setRescheduleNote(e.target.value)} placeholder="ระบุเหตุผลหรือหมายเหตุการเลื่อนนัด" style={{width:'100%', minHeight: 40}}/>
                    <div className="button-group">
                        <button className="btn-primary" onClick={handleConfirmReschedule}>ยืนยันการเลื่อนนัด</button>
                        <button className="btn-secondary" onClick={handleCloseModal}>ยกเลิก</button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} title="ยกเลิกการรักษา/นัดหมาย">
                <div className="reschedule-form">
                    <p>ยกเลิกสำหรับ: <strong>{selectedAppointment?.patient.firstName}</strong></p>
                    <label htmlFor="cancelNote">หมายเหตุ (ถ้ามี):</label>
                    <textarea id="cancelNote" value={cancelNote} onChange={e => setCancelNote(e.target.value)} placeholder="ระบุเหตุผลหรือหมายเหตุการยกเลิก" style={{width:'100%', minHeight: 40}}/>
                    <div className="button-group">
                        <button className="btn-primary" onClick={handleConfirmCancel}>ยืนยันการยกเลิก</button>
                        <button className="btn-secondary" onClick={() => setIsCancelModalOpen(false)}>ยกเลิก</button>
                    </div>
                </div>
            </Modal>

            {/* Admit Modal */}
            <Modal isOpen={isAdmitModalOpen} onClose={handleCancelAdmitModal} title="เลือกวันที่ Admit (Check-in)">
                <div className="reschedule-form">
                    <p>เลือกวันที่ Admit สำหรับ: <strong>{selectedAppointment?.patient.firstName}</strong></p>
                    <label htmlFor="admitDate">วันที่ Admit:</label>
                    <input type="date" id="admitDate" value={admitDate} onChange={e => setAdmitDate(e.target.value)} />
                    <div className="button-group">
                        <button className="btn-primary" onClick={handleConfirmAdmit}>ยืนยัน Admit</button>
                        <button className="btn-secondary" onClick={handleCancelAdmitModal}>ยกเลิก</button>
                    </div>
                </div>
            </Modal>

            {/* Cancel Modal with Date */}
            <Modal isOpen={isCancelDateModalOpen} onClose={handleCancelCancelModal} title="เลือกวันที่ Cancel">
                <div className="reschedule-form">
                    <p>เลือกวันที่ Cancel สำหรับ: <strong>{selectedAppointment?.patient.firstName}</strong></p>
                    <label htmlFor="cancelDate">วันที่ Cancel:</label>
                    <input type="date" id="cancelDate" value={cancelDate} onChange={e => setCancelDate(e.target.value)} />
                    <div className="button-group">
                        <button className="btn-primary" onClick={handleConfirmCancelWithDate}>ยืนยัน Cancel</button>
                        <button className="btn-secondary" onClick={handleCancelCancelModal}>ยกเลิก</button>
                    </div>
                </div>
            </Modal>

            {/* Discharge Modal */}
            <Modal isOpen={isDischargeModalOpen} onClose={handleCancelDischargeModal} title="เลือกวันที่ Discharge">
                <div className="reschedule-form">
                    <p>เลือกวันที่ Discharge สำหรับ: <strong>{selectedAppointment?.patient.firstName}</strong></p>
                    <label htmlFor="dischargeDate">วันที่ Discharge:</label>
                    <input type="date" id="dischargeDate" value={dischargeDate} onChange={e => setDischargeDate(e.target.value)} />
                    <div className="button-group">
                        <button className="btn-primary" onClick={handleConfirmDischarge}>ยืนยัน Discharge</button>
                        <button className="btn-secondary" onClick={handleCancelDischargeModal}>ยกเลิก</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
} 