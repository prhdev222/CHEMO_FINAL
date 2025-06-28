import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { FaEdit, FaTrash, FaPlus, FaFilePdf, FaFileExcel, FaTimes, FaCheckCircle, FaCalendarAlt, FaFilter } from 'react-icons/fa';
import '../assets/fonts/THSarabunNew-normal.js';
import '../styles/dashboard.css';
import '../styles/common.css';

const API_URL = import.meta.env.VITE_API_URL;

// --- Reusable Modal ---
const Modal = ({ children, onClose, title }) => (
    <div className="modal-overlay">
        <div className="modal-content">
            <div className="modal-header">
                <h4>{title}</h4>
                <button onClick={onClose} className="modal-close-btn"><FaTimes /></button>
            </div>
            <div className="modal-body">{children}</div>
        </div>
    </div>
);

// --- Status Badge ---
const StatusBadge = ({ status }) => {
    const statusMap = {
        waiting: { text: 'รอนัดให้ยาเคมี', color: '#ffc107' },
        admit: { text: 'Admit', color: '#28a745' },
        discharged: { text: 'Discharged', color: '#007bff' },
        missed: { text: 'Missed', color: '#dc3545' },
        rescheduled: { text: 'เลื่อนนัดหมาย', color: '#6c757d' },
        cancelled: { text: 'ยกเลิกเคมีบำบัด', color: '#dc3545' },
        followup: { text: 'Follow up OPD', color: '#17a2b8' }
    };
    const currentStatus = statusMap[status.toLowerCase()] || { text: status, color: '#6c757d' };

    return (
        <span style={{
            backgroundColor: currentStatus.color,
            color: 'white',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '0.8rem',
            textTransform: 'capitalize'
        }}>
            {currentStatus.text}
        </span>
    );
};

// --- Filter Section ---
const statusLabelMap = {
    waiting: 'รอนัดให้ยาเคมี',
    followup: 'Follow up OPD',
    rescheduled: 'เลื่อนนัด',
    cancelled: 'ยกเลิก'
};
const FilterSection = ({ filters, onFilterChange, onReset, availableStatuses }) => {
    return (
        <div className="filter-section">
            <div className="filter-header">
                <FaFilter /> <span>ตัวกรองข้อมูล</span>
            </div>
            <div className="filter-controls">
                <div className="filter-group">
                    <label>ช่วงวันที่:</label>
                    <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => onFilterChange('startDate', e.target.value)}
                    />
                    <span>ถึง</span>
                    <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => onFilterChange('endDate', e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <label>สถานะ:</label>
                    <select
                        value={filters.status}
                        onChange={(e) => onFilterChange('status', e.target.value)}
                    >
                        <option value="">ทั้งหมด</option>
                        {availableStatuses.map(s => (
                            <option key={s} value={s}>{statusLabelMap[s] || s}</option>
                        ))}
                    </select>
                </div>
                <button onClick={onReset} className="btn-secondary">ล้างตัวกรอง</button>
            </div>
        </div>
    );
};

// --- Export Selection Modal ---
const ExportSelectionModal = ({ patients, onExport, onClose }) => {
    const [selectedPatients, setSelectedPatients] = useState([]);
    const [selectAll, setSelectAll] = useState(false);

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedPatients([]);
        } else {
            setSelectedPatients(patients.map(p => p.id));
        }
        setSelectAll(!selectAll);
    };

    const handlePatientSelect = (patientId) => {
        setSelectedPatients(prev => 
            prev.includes(patientId) 
                ? prev.filter(id => id !== patientId)
                : [...prev, patientId]
        );
    };

    const handleExport = () => {
        onExport(selectedPatients);
        onClose();
    };

    return (
        <Modal onClose={onClose} title="เลือกผู้ป่วยสำหรับ Export">
            <div className="export-selection">
                <div className="select-all-section">
                    <label>
                        <input
                            type="checkbox"
                            checked={selectAll}
                            onChange={handleSelectAll}
                        />
                        เลือกทั้งหมด
                    </label>
                </div>
                <div className="patient-list">
                    {patients.map(patient => (
                        <label key={patient.id} className="patient-item">
                            <input
                                type="checkbox"
                                checked={selectedPatients.includes(patient.id)}
                                onChange={() => handlePatientSelect(patient.id)}
                            />
                            {patient.hn} - {patient.firstName} {patient.lastName}
                        </label>
                    ))}
                </div>
                <div className="export-actions">
                    <button onClick={onClose} className="btn-secondary">ยกเลิก</button>
                    <button onClick={handleExport} className="btn-primary" disabled={selectedPatients.length === 0}>
                        Export ({selectedPatients.length} ราย)
                    </button>
                </div>
            </div>
        </Modal>
    );
};

// --- Appointment Form for Add/Edit ---
const AppointmentForm = ({ onSubmit, onCancel, patients, initialData }) => {
    const [formData, setFormData] = useState({
        patientId: '',
        date: '',
        chemoRegimen: '',
        note: '',
        admitStatus: 'waiting'
    });

    useEffect(() => {
        const initialDate = initialData?.date
            ? new Date(initialData.date).toISOString().substring(0, 16)
            : new Date(new Date().setMinutes(new Date().getMinutes() - new Date().getTimezoneOffset())).toISOString().slice(0, 16);

        setFormData({
            patientId: initialData?.patient?.id || initialData?.patientId || '',
            date: initialDate,
            chemoRegimen: initialData?.chemoRegimen || '',
            note: initialData?.note || '',
            admitStatus: initialData?.admitStatus || 'waiting'
        });
    }, [initialData]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = (e) => {
        e.preventDefault();
        // ถ้าเป็น followup ไม่ต้องส่ง chemoRegimen
        const data = { ...formData };
        if (data.admitStatus === 'followup') {
            data.chemoRegimen = '';
        }
        if (data.admitStatus === 'waiting') {
            data.note = '';
        }
        onSubmit(data);
    };

    return (
        <form onSubmit={handleSubmit} className="appointment-form">
            <div className="form-group">
                <label htmlFor="patientId">ผู้ป่วย</label>
                <select id="patientId" name="patientId" value={formData.patientId} onChange={handleChange} required>
                    <option value="">-- เลือกผู้ป่วย --</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.hn} - {p.firstName} {p.lastName}</option>)}
                </select>
            </div>
            <div className="form-group">
                <label>วันที่นัด:</label>
                <input type="datetime-local" name="date" value={formData.date} onChange={handleChange} required />
            </div>
            <div className="form-group">
                <label>สถานะเริ่มต้น:</label>
                <select name="admitStatus" value={formData.admitStatus} onChange={handleChange} required>
                    <option value="waiting">รอนัดให้ยาเคมี (แนบสูตรยา)</option>
                    <option value="followup">Follow up OPD (note)</option>
                </select>
            </div>
            {formData.admitStatus === 'waiting' && (
                <div className="form-group">
                    <label>Chemo Regimen:</label>
                    <input type="text" name="chemoRegimen" value={formData.chemoRegimen} onChange={handleChange} required placeholder="เช่น R-CHOP" />
                </div>
            )}
            {formData.admitStatus === 'followup' && (
                <div className="form-group">
                    <label>Note การวางแผน follow up:</label>
                    <textarea name="note" value={formData.note} onChange={handleChange} required placeholder="รายละเอียดการ follow up" />
                </div>
            )}
            <div className="form-actions">
                <button type="button" onClick={onCancel} className="btn-secondary">ยกเลิก</button>
                <button type="submit" className="btn-primary">บันทึก</button>
            </div>
        </form>
    );
};

// --- Main Dashboard Component ---
export default function AppointmentDashboard() {
    const [appointments, setAppointments] = useState([]);
    const [allAppointments, setAllAppointments] = useState([]); // สำหรับเก็บข้อมูลทั้งหมด
    const [loading, setLoading] = useState(true);
    const [patients, setPatients] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState(null);
    const { token, user } = useContext(AuthContext);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        status: ''
    });
    const [selectedRows, setSelectedRows] = useState([]);
    const [availableStatuses, setAvailableStatuses] = useState([]);

    const fetchAllAppointments = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/appointments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch appointments');
            const data = await response.json();
            const allData = Array.isArray(data) ? data : [];
            setAllAppointments(allData);
            
            // กรองข้อมูลสำหรับแสดงในตาราง (เฉพาะสถานะที่ต้องการ)
            const filteredData = allData.filter(a => 
                a.admitStatus === 'waiting' || 
                a.admitStatus === 'rescheduled' || 
                a.admitStatus === 'missed' || 
                a.admitStatus === 'followup' ||
                a.admitStatus === 'cancelled'
            );
            setAppointments(filteredData);
        } catch (error) {
            console.error('Error fetching appointments:', error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    const fetchPatients = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/api/patients`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch patients');
            const data = await response.json();
            setPatients(Array.isArray(data) ? data.filter(p => p.status === 'ACTIVE') : []);
        } catch (error) {
            console.error('Error fetching patients:', error);
        }
    }, [token]);

    // Fetch available statuses from backend
    useEffect(() => {
        const fetchStatuses = async () => {
            try {
                const response = await fetch(`${API_URL}/api/appointments/statuses`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Failed to fetch statuses');
                let data = await response.json();
                // filter เฉพาะ 4 สถานะที่ต้องการ
                data = data.filter(s => ['waiting','followup','rescheduled','cancelled'].includes(s));
                setAvailableStatuses(data);
            } catch (error) {
                setAvailableStatuses(['waiting','followup','rescheduled','cancelled']); // fallback
            }
        };
        if(token) fetchStatuses();
    }, [token]);

    useEffect(() => {
        if(token){
            fetchAllAppointments();
            fetchPatients();
        }
    }, [token, fetchAllAppointments, fetchPatients]);

    const handleOpenModal = (app = null) => {
        setEditingAppointment(app);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingAppointment(null);
        setIsModalOpen(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("ลบข้อมูลนี้จะทำให้รายการหายจากแดชบอร์ด แต่ข้อมูลยังคงอยู่ในระบบฐานข้อมูล\n\nคุณแน่ใจหรือไม่ว่าต้องการลบนัดหมายนี้?")) return;
        try {
            const response = await fetch(`${API_URL}/api/appointments/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
             if (!response.ok) throw new Error('Failed to delete appointment');
            fetchAllAppointments();
        } catch (error) {
            console.error('Error deleting appointment:', error);
            alert(`เกิดข้อผิดพลาด: ${error.message}`);
        }
    };
    
    const handleSave = async (formData) => {
        const url = editingAppointment
            ? `${API_URL}/api/appointments/${editingAppointment.id}`
            : `${API_URL}/api/appointments`;
        const method = editingAppointment ? 'PUT' : 'POST';

        // Ensure patientId is a number
        const payload = {
            ...formData,
            patientId: Number(formData.patientId)
        };
        
        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                 const errorData = await response.json();
                 throw new Error(errorData.error || 'Failed to save appointment');
            }
            
            // แสดง notify สำหรับการ edit
            if (editingAppointment) {
                alert('บันทึกการแก้ไขข้อมูลเรียบร้อยแล้ว\nหมายเหตุ: หากต้องการเลื่อนนัดหรือยกเลิกนัด กรุณาไปที่หน้าแดชบอร์ดเคมีบำบัด');
            }
            
            fetchAllAppointments();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving appointment:', error);
            alert(`เกิดข้อผิดพลาด: ${error.message}`);
        }
    };

    const handleAdmit = async (id) => {
        if (!window.confirm("คุณต้องการ Admit ผู้ป่วยรายนี้ และนำรายการนี้ออกจากหน้าแดชบอร์ดใช่หรือไม่?")) return;
        try {
            const response = await fetch(`${API_URL}/api/appointments/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ admitStatus: 'admit', admitDate: new Date().toISOString() })
            });
            if (!response.ok) throw new Error('Failed to admit patient');
            fetchAllAppointments();
        } catch (error) {
            console.error('Error admitting patient:', error);
            alert(`เกิดข้อผิดพลาด: ${error.message}`);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleResetFilters = () => {
        setFilters({
            startDate: '',
            endDate: '',
            status: ''
        });
    };

    // Filtered appointments based on search and filters (ต้องอยู่ก่อนการใช้ตัวแปรนี้)
    const filteredAppointments = allAppointments.filter(app => {
        // Search filter
        const hn = app.patient?.hn?.toLowerCase() || '';
        const name = `${app.patient?.firstName || ''} ${app.patient?.lastName || ''}`.toLowerCase();
        const searchMatch = hn.includes(searchTerm.toLowerCase()) || name.includes(searchTerm.toLowerCase());
        // Date filter
        let dateMatch = true;
        if (filters.startDate || filters.endDate) {
            const appDate = new Date(app.date);
            if (filters.startDate) {
                dateMatch = dateMatch && appDate >= new Date(filters.startDate);
            }
            if (filters.endDate) {
                dateMatch = dateMatch && appDate <= new Date(filters.endDate + 'T23:59:59');
            }
        }
        // Status filter
        const statusMatch = !filters.status || app.admitStatus === filters.status;
        return searchMatch && dateMatch && statusMatch;
    });

    // --- Checkbox logic ---
    const isAllSelected = filteredAppointments.length > 0 && selectedRows.length === filteredAppointments.length;
    const isIndeterminate = selectedRows.length > 0 && selectedRows.length < filteredAppointments.length;

    const handleSelectAll = () => {
        if (isAllSelected) {
            setSelectedRows([]);
        } else {
            setSelectedRows(filteredAppointments.map(app => app.id));
        }
    };

    const handleSelectRow = (id) => {
        setSelectedRows(prev =>
            prev.includes(id)
                ? prev.filter(rowId => rowId !== id)
                : [...prev, id]
        );
    };

    // --- Export ---
    const exportPDF = () => {
        const doc = new jsPDF();
        doc.setFont('THSarabunNew');
        doc.setFontSize(18);
        doc.text(`ตารางนัดหมาย`, 14, 22);

        let dataToExport = filteredAppointments;
        if (selectedRows.length > 0) {
            dataToExport = filteredAppointments.filter(app => selectedRows.includes(app.id));
        }

        autoTable(doc, {
            startY: 30,
            head: [['HN', 'ผู้ป่วย', 'เบอร์โทร', 'Regimen', 'วันที่นัด', 'สถานะ']],
            body: dataToExport.map(app => [
                app.patient?.hn,
                `${app.patient?.firstName} ${app.patient?.lastName}`,
                app.patient?.phone || '-',
                app.chemoRegimen || '-',
                new Date(app.date).toLocaleDateString('th-TH'),
                app.admitStatus
            ]),
            styles: { font: 'THSarabunNew', fontStyle: 'normal', lineWidth: 0.1, lineColor: '#888' },
            headStyles: { font: 'THSarabunNew', fontStyle: 'normal', fillColor: false, textColor: '#000' },
            tableLineWidth: 0.1,
            tableLineColor: '#888',
        });
        doc.save(`appointments.pdf`);
    };

    const exportExcel = () => {
        let dataToExport = filteredAppointments;
        if (selectedRows.length > 0) {
            dataToExport = filteredAppointments.filter(app => selectedRows.includes(app.id));
        }
        const worksheet = XLSX.utils.json_to_sheet(dataToExport.map(app => ({
            'HN': app.patient?.hn,
            'ผู้ป่วย': `${app.patient?.firstName} ${app.patient?.lastName}`,
            'เบอร์โทร': app.patient?.phone || '-',
            'Regimen': app.chemoRegimen || '-',
            'วันที่นัด': new Date(app.date).toLocaleDateString('th-TH'),
            'สถานะ': app.admitStatus
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'นัดหมาย');
        XLSX.writeFile(workbook, 'appointments.xlsx');
    };

    return (
        <div className="appointment-dashboard-container">
            <div className="page-header">
                <h1>การจัดการนัดหมาย</h1>
                <div className="header-actions">
                    <button onClick={() => handleOpenModal()} className="btn-add-new"><FaPlus /> เพิ่มนัดหมาย</button>
                    <button onClick={exportPDF} className="btn-export"><FaFilePdf /> Export PDF</button>
                    <button onClick={exportExcel} className="btn-export"><FaFileExcel /> Export Excel</button>
                </div>
            </div>

            <div className="content-card">
                <FilterSection 
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onReset={handleResetFilters}
                    availableStatuses={availableStatuses}
                />
                
                <div className="card-body">
                    <div className="form-group" style={{ maxWidth: 320, marginBottom: 16 }}>
                        <input
                            type="text"
                            placeholder="ค้นหา HN หรือชื่อผู้ป่วย..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ width: '100%' }}
                        />
                    </div>
                    <table className="patient-table">
                        <colgroup>
                            <col style={{ width: '40px' }} />
                            <col style={{ width: '120px' }} />
                            <col />
                            <col style={{ width: '120px' }} />
                            <col style={{ width: '100px' }} />
                            <col style={{ width: '140px' }} />
                            <col style={{ width: '110px' }} />
                        </colgroup>
                        <thead>
                            <tr>
                                <th>
                                    <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        ref={el => { if (el) el.indeterminate = isIndeterminate; }}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th>HN</th>
                                <th>ผู้ป่วย</th>
                                <th>Regimen</th>
                                <th>วันที่นัด</th>
                                <th>สถานะ</th>
                                <th>การจัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="7" style={{textAlign: 'center'}}>Loading...</td></tr>
                            ) : filteredAppointments.length > 0 ? (
                                filteredAppointments.map(app => (
                                    <tr key={app.id}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedRows.includes(app.id)}
                                                onChange={() => handleSelectRow(app.id)}
                                            />
                                        </td>
                                        <td>{app.patient?.hn || 'N/A'}</td>
                                        <td>{app.patient ? `${app.patient.firstName} ${app.patient.lastName}` : 'N/A'}</td>
                                        <td>{app.chemoRegimen || '-'}</td>
                                        <td>{new Date(app.date).toLocaleDateString('th-TH')}</td>
                                        <td><StatusBadge status={app.admitStatus} className="status-badge-table" /></td>
                                        <td>
                                            <div className="action-buttons">
                                                {app.admitStatus === 'waiting' && (
                                                    <button onClick={() => handleAdmit(app.id)} className="btn-action btn-admit" title="Admit Patient">
                                                        <FaCheckCircle /> Admit
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => handleOpenModal(app)} 
                                                    className="btn-icon" 
                                                    title="แก้ไขข้อมูล (สำหรับแก้ไขข้อมูลเท่านั้น หากต้องการเลื่อนนัดหรือยกเลิกนัดให้ยาเคมีบำบัด กรุณาไปที่หน้าแดชบอร์ดเคมีบำบัด)"
                                                >
                                                    <FaEdit />
                                                </button>
                                                {user?.role === 'ADMIN' && (
                                                    <button onClick={() => handleDelete(app.id)} className="btn-icon btn-delete" title="ลบ"><FaTrash /></button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="7" style={{textAlign: 'center'}}>ไม่พบการนัดหมาย</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <Modal 
                    onClose={handleCloseModal}
                    title={editingAppointment ? "แก้ไขนัดหมาย" : "เพิ่มนัดหมายใหม่"}
                >
                    <AppointmentForm
                        onSubmit={handleSave}
                        onCancel={handleCloseModal}
                        patients={patients}
                        initialData={editingAppointment}
                    />
                </Modal>
            )}
        </div>
    );
}
