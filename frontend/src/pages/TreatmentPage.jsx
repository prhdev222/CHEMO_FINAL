import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import '../assets/fonts/THSarabunNew-normal.js';
import '../styles/treatment.css';
import '../styles/common.css';
import { FaUserMd, FaStethoscope, FaCalendarAlt, FaFileMedicalAlt, FaSearch } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const Modal = ({ children, onClose, title, size }) => (
    <div className="modal-overlay">
        <div className={`modal-content ${size === 'lg' ? 'modal-lg' : ''}`}>
            <div className="modal-header">
                <h4>{title}</h4>
                <button onClick={onClose} className="modal-close-btn">&times;</button>
            </div>
            <div className="modal-body">{children}</div>
        </div>
    </div>
);

// Sub-component to manage the list of attachments in the form
const AttachmentManager = ({ existingAttachments = [], onRemove, newAttachments, onNewFileChange, onNewFileNameChange }) => {
    return (
        <div className="attachment-manager">
            <label>เอกสารแนบปัจจุบัน:</label>
            {existingAttachments.length > 0 ? (
                <ul className="attachment-list">
                    {existingAttachments.map((att, index) => (
                        <li key={index} className="attachment-item">
                            <a href={`${API_BASE_URL}/${att.path}`} target="_blank" rel="noopener noreferrer">{att.name}</a>
                            <button type="button" onClick={() => onRemove(att.path)} className="btn-delete-attachment">ลบ</button>
                        </li>
                    ))}
                </ul>
            ) : <p>ไม่มีไฟล์แนบ</p>}
            
            <hr />
            <label>เพิ่มไฟล์แนบใหม่:</label>
            {newAttachments.map((file, index) => (
                 <div key={index} className="new-attachment-row">
                    <input 
                        type="text" 
                        placeholder={`ชื่อไฟล์ที่ ${index + 1}`}
                        value={file.displayName}
                        onChange={(e) => onNewFileNameChange(index, e.target.value)}
                        className="attachment-name-input"
                    />
                    <span>{file.file.name}</span>
                </div>
            ))}
            <input 
                type="file" 
                multiple 
                onChange={onNewFileChange} 
                className="attachment-file-input"
            />
        </div>
    );
};

const TreatmentForm = ({ patient, onSave, onCancel, onAttachmentDelete }) => {
    const [formData, setFormData] = useState({
        diagnosis: '',
        diagnosisDate: '',
        stage: '',
        prognosis: '',
        treatmentPlan: { details: '', currentStatus: '', relapsedNumber: '', diagnosisGroup: '' }
    });
    const [newAttachments, setNewAttachments] = useState([]); // { file: File, displayName: string }[]
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [detailsDraft, setDetailsDraft] = useState('');
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (patient) {
            setFormData({
                diagnosis: patient.diagnosis || '',
                diagnosisDate: patient.diagnosisDate ? patient.diagnosisDate.split('T')[0] : '',
                stage: patient.stage || '',
                prognosis: patient.prognosis || '',
                treatmentPlan: patient.treatmentPlan && patient.treatmentPlan.details
                    ? {
                        details: patient.treatmentPlan.details || '',
                        currentStatus: patient.treatmentPlan.currentStatus || '',
                        relapsedNumber: patient.treatmentPlan.relapsedNumber || '',
                        diagnosisGroup: patient.treatmentPlan.diagnosisGroup || ''
                    }
                    : { details: '', currentStatus: '', relapsedNumber: '', diagnosisGroup: '' }
            });
            setDetailsDraft(patient.treatmentPlan?.details || '');
            setNewAttachments([]);
        }
    }, [patient]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'treatmentPlanDetails') {
            setDetailsDraft(value);
        } else if (name === 'currentStatus') {
            setFormData(prev => ({ ...prev, treatmentPlan: { ...prev.treatmentPlan, currentStatus: value, relapsedNumber: '' } }));
        } else if (name === 'relapsedNumber') {
            setFormData(prev => ({ ...prev, treatmentPlan: { ...prev.treatmentPlan, relapsedNumber: value } }));
        } else if (name === 'diagnosisGroup') {
            setFormData(prev => ({ ...prev, treatmentPlan: { ...prev.treatmentPlan, diagnosisGroup: value } }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleNewFileChange = (e) => {
        const files = Array.from(e.target.files);
        const newFiles = files.map(file => ({ file, displayName: file.name }));
        setNewAttachments(prev => [...prev, ...newFiles]);
    };
    
    const handleNewFileNameChange = (index, newName) => {
        setNewAttachments(prev => {
            const updated = [...prev];
            updated[index].displayName = newName;
            return updated;
        });
    };

    const handleDeleteAll = () => {
        setShowDeleteConfirm(true);
    };

    const confirmDeleteAll = () => {
        setFormData({
            diagnosis: '',
            diagnosisDate: '',
            stage: '',
            prognosis: '',
            treatmentPlan: { details: '', currentStatus: '', relapsedNumber: '', diagnosisGroup: '' }
        });
        setDetailsDraft('');
        setNewAttachments([]);
        setShowDeleteConfirm(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setShowPreviewModal(true);
    };

    const handleConfirmSave = () => {
        const finalFormData = new FormData();
        // Append all text fields
        Object.keys(formData).forEach(key => {
            if (key === 'treatmentPlan') {
                finalFormData.append(key, JSON.stringify({ ...formData.treatmentPlan, details: detailsDraft }));
            } else {
                finalFormData.append(key, formData[key]);
            }
        });
        // Append new files and their names
        newAttachments.forEach(att => {
            finalFormData.append('newAttachments', att.file);
        });
        const attachmentNames = newAttachments.map(att => att.displayName);
        finalFormData.append('attachmentNames', JSON.stringify(attachmentNames));
        setShowPreviewModal(false);
        onSave(finalFormData);
    };

    return (
        <form onSubmit={handleSubmit} className="treatment-form">
            <div className="form-grid">
                <div className="form-group large-input" style={{ marginBottom: '1.5rem' }}>
                    <label style={{ marginBottom: '0.5rem', display: 'block' }}>Diagnosis</label>
                    <input name="diagnosis" value={formData.diagnosis} onChange={handleChange} placeholder="การวินิจฉัย *" required />
                </div>
                <div className="form-group large-input" style={{ marginBottom: '1.5rem' }}>
                    <label style={{ marginBottom: '0.5rem', display: 'block' }}>Staging</label>
                    <input name="stage" value={formData.stage} onChange={handleChange} placeholder="Stage *" required />
                </div>
                <div className="form-group large-input" style={{ marginBottom: '1.5rem' }}>
                    <label style={{ marginBottom: '0.5rem', display: 'block' }}>Prognosis</label>
                    <input name="prognosis" value={formData.prognosis} onChange={handleChange} placeholder="Prognosis" />
                </div>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label style={{ marginBottom: '0.5rem', display: 'block' }}>วันที่วินิจฉัย</label>
                    <input name="diagnosisDate" type="date" value={formData.diagnosisDate} onChange={handleChange} required />
                </div>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label style={{ marginBottom: '0.5rem', display: 'block' }}>กลุ่มการวินิจฉัย</label>
                    <select
                        name="diagnosisGroup"
                        value={formData.treatmentPlan.diagnosisGroup}
                        onChange={handleChange}
                        required
                    >
                        <option value="">-- เลือกกลุ่ม --</option>
                        <option value="indolent">Low grade (Indolent) lymphoma</option>
                        <option value="cll">Chronic lymphocytic leukemia</option>
                        <option value="aggressive">High grade (aggressive) lymphoma</option>
                        <option value="plasma">Plasma cell neoplasm</option>
                        <option value="mds">MDS</option>
                        <option value="mpnmds">MPN/MDS</option>
                        <option value="mpn">MPN</option>
                        <option value="cml">CML</option>
                        <option value="acute">Acute leukemia</option>
                        <option value="otherhemo">Other hematologic disease</option>
                        <option value="other">Other...</option>
                    </select>
                </div>
            </div>
            <AttachmentManager 
                existingAttachments={patient.attachments || []}
                onRemove={onAttachmentDelete}
                newAttachments={newAttachments}
                onNewFileChange={handleNewFileChange}
                onNewFileNameChange={handleNewFileNameChange}
            />
            <div className="form-group">
                <label>รายละเอียดแผนการรักษา:</label>
                <button type="button" className="btn-link" onClick={() => setShowDetailsModal(true)}>
                    {detailsDraft ? 'แก้ไขรายละเอียดแผนการรักษา' : 'กรอกรายละเอียดแผนการรักษา'}
                </button>
            </div>
            <div className="form-group full-width" style={{ marginBottom: '2rem', marginTop: '1.5rem' }}>
                <label style={{ marginBottom: '0.5rem', display: 'block' }}>สรุปสถานะการรักษาในปัจจุบัน:</label>
                <select name="currentStatus" value={formData.treatmentPlan.currentStatus} onChange={handleChange} required>
                    <option value="">-- เลือกสถานะ --</option>
                    <option value="first">First treatment</option>
                    <option value="cr">Complete remission (CR)</option>
                    <option value="pr">Partial remission (PR)</option>
                    <option value="sd">Stable disease (SD)</option>
                    <option value="relapsed">Relapsed</option>
                    <option value="refractory">Refractory/Progression disease</option>
                    <option value="palliative">Palliative care</option>
                    <option value="waitwatch">wait and watch</option>
                    <option value="refer">refer</option>
                </select>
                {formData.treatmentPlan.currentStatus === 'relapsed' && (
                    <div className="form-group">
                        <label style={{ marginBottom: '0.5rem', display: 'block' }}>Relapsed ครั้งที่:</label>
                        <input name="relapsedNumber" value={formData.treatmentPlan.relapsedNumber} onChange={handleChange} placeholder="เช่น 1st, 2nd, 3rd" required />
                    </div>
                )}
                {formData.treatmentPlan.currentStatus === 'refer' && (
                    <div className="form-group" style={{ marginTop: '1rem' }}>
                        <label style={{ marginBottom: '0.5rem', display: 'block' }}>วันที่ refer</label>
                        <input name="referDate" type="date" value={formData.treatmentPlan.referDate || ''} onChange={e => setFormData(prev => ({ ...prev, treatmentPlan: { ...prev.treatmentPlan, referDate: e.target.value } }))} />
                        <label style={{ marginBottom: '0.5rem', display: 'block', marginTop: '0.7rem' }}>refer โรงพยาบาลไหน</label>
                        <input name="referHospital" value={formData.treatmentPlan.referHospital || ''} onChange={e => setFormData(prev => ({ ...prev, treatmentPlan: { ...prev.treatmentPlan, referHospital: e.target.value } }))} placeholder="ชื่อโรงพยาบาล" />
                        <label style={{ marginBottom: '0.5rem', display: 'block', marginTop: '0.7rem' }}>เหตุผลที่ refer</label>
                        <input name="referReason" value={formData.treatmentPlan.referReason || ''} onChange={e => setFormData(prev => ({ ...prev, treatmentPlan: { ...prev.treatmentPlan, referReason: e.target.value } }))} placeholder="เหตุผลที่ refer" />
                    </div>
                )}
            </div>
            <div className="form-actions">
                <button type="button" onClick={onCancel} className="btn-secondary">ยกเลิก</button>
                <button type="button" onClick={handleDeleteAll} className="btn-danger">ลบข้อมูลทั้งหมด</button>
                <button type="submit" className="btn-primary">บันทึกแผนการรักษา</button>
            </div>
            {/* Modal สำหรับกรอกรายละเอียดแผนการรักษา */}
            {showDetailsModal && (
                <Modal onClose={() => setShowDetailsModal(false)} title="กรอกรายละเอียดแผนการรักษา" size="lg">
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <textarea
                            className="treatment-full-textarea"
                            value={detailsDraft}
                            onChange={e => setDetailsDraft(e.target.value)}
                            style={{ width: '98vw', maxWidth: '1200px', height: '70vh', fontSize: '1.2rem', padding: '1.5rem', borderRadius: '12px', marginTop: '2rem' }}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                        <button className="btn-secondary" onClick={() => setShowDetailsModal(false)}>ยกเลิก</button>
                        <button className="btn-primary" onClick={() => setShowDetailsModal(false)}>บันทึก</button>
                    </div>
                </Modal>
            )}
            {/* Modal ยืนยันลบข้อมูลทั้งหมด */}
            {showDeleteConfirm && (
                <Modal onClose={() => setShowDeleteConfirm(false)} title="ยืนยันการลบข้อมูลทั้งหมด">
                    <p>คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้</p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                        <button className="btn-secondary" onClick={() => setShowDeleteConfirm(false)}>ยกเลิก</button>
                        <button className="btn-danger" onClick={confirmDeleteAll}>ยืนยันการลบ</button>
                    </div>
                </Modal>
            )}
            {/* Modal Preview ข้อมูลก่อนบันทึก */}
            {showPreviewModal && (
                <Modal onClose={() => setShowPreviewModal(false)} title="ยืนยันข้อมูลแผนการรักษา">
                    <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                        <h4>Diagnosis: {formData.diagnosis}</h4>
                        <h4>Staging: {formData.stage}</h4>
                        <h4>Prognosis: {formData.prognosis}</h4>
                        <h4>วันที่วินิจฉัย: {formData.diagnosisDate}</h4>
                        <h4>กลุ่มการวินิจฉัย: {(() => {
                            const g = formData.treatmentPlan.diagnosisGroup;
                            if (g === 'indolent') return 'Low grade (Indolent) lymphoma';
                            if (g === 'cll') return 'Chronic lymphocytic leukemia';
                            if (g === 'aggressive') return 'High grade (aggressive) lymphoma';
                            if (g === 'plasma') return 'Plasma cell neoplasm';
                            if (g === 'mds') return 'MDS';
                            if (g === 'mpnmds') return 'MPN/MDS';
                            if (g === 'mpn') return 'MPN';
                            if (g === 'cml') return 'CML';
                            if (g === 'acute') return 'Acute leukemia';
                            if (g === 'otherhemo') return 'Other hematologic disease';
                            if (g === 'other') return 'Other...';
                            return '-';
                        })()}</h4>
                        <h4>รายละเอียดแผนการรักษา:</h4>
                        <div style={{ background: '#f9f9f9', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{detailsDraft || '-'}</div>
                        <h4>สรุปสถานะการรักษาในปัจจุบัน: {(() => {
                            const s = formData.treatmentPlan.currentStatus;
                            if (s === 'first') return 'First treatment';
                            if (s === 'cr') return 'Complete remission (CR)';
                            if (s === 'pr') return 'Partial remission (PR)';
                            if (s === 'relapsed') return `Relapsed${formData.treatmentPlan.relapsedNumber ? `: ${formData.treatmentPlan.relapsedNumber}` : ''}`;
                            if (s === 'refractory') return 'Refractory/Progression disease';
                            if (s === 'palliative') return 'Palliative care';
                            return '-';
                        })()}</h4>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                        <button className="btn-secondary" onClick={() => setShowPreviewModal(false)}>ยกเลิก</button>
                        <button className="btn-primary" onClick={handleConfirmSave}>ยืนยันการบันทึก</button>
                    </div>
                </Modal>
            )}
        </form>
    );
};

export default function TreatmentPage() {
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isReadMoreModalOpen, setIsReadMoreModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const { user, token } = useContext(AuthContext);
    
    const canView = user?.role === 'ADMIN' || user?.role === 'DOCTOR' || user?.role === 'NURSE';
    const canManage = user?.role === 'ADMIN' || user?.role === 'DOCTOR';

    const [isFullScreenModalOpen, setIsFullScreenModalOpen] = useState(false);
    const [isFullScreenEdit, setIsFullScreenEdit] = useState(false);
    const [fullScreenEditValue, setFullScreenEditValue] = useState('');

    useEffect(() => {
        if (canView) {
            fetchPatients();
        }
    }, [canView, token]);

    const fetchPatients = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/patients`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setPatients(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching patients:', error);
        }
    };
    
    const handleSelectPatient = (patientId) => {
        const patient = patients.find(p => p.id === parseInt(patientId));
        setSelectedPatient(patient || null);
    };

    const filteredPatients = patients.filter(p => 
        p.hn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAttachmentDelete = async (attachmentPath) => {
        if (!selectedPatient || !window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบไฟล์นี้?')) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/patients/id/${selectedPatient.id}/delete-attachment`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ attachmentPath })
            });
            if (!response.ok) throw new Error('Failed to delete attachment');
            const updatedPatient = await response.json();
            // Update local state
            setPatients(patients.map(p => p.id === updatedPatient.id ? updatedPatient : p));
            setSelectedPatient(updatedPatient);
        } catch (error) {
            console.error("Delete attachment error:", error);
        }
    };

    const handleSaveTreatment = async (formData) => {
        if (!selectedPatient) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/patients/id/${selectedPatient.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    // 'Content-Type' is intentionally omitted; browser sets it for FormData
                },
                body: formData,
            });
            if (!response.ok) throw new Error('Failed to save treatment plan');
            const updatedPatient = await response.json();
            
            // Update local state
            setPatients(patients.map(p => p.id === updatedPatient.id ? updatedPatient : p));
            setSelectedPatient(updatedPatient);
            
            closeEditModal();
        } catch (error) {
            console.error("Save error:", error);
            // You might want to show an error message to the user
        }
    };

    const exportPatientPDF = () => {
        if (!selectedPatient) return;

        const doc = new jsPDF();
        doc.setFont('THSarabunNew');

        // Header
        doc.setFontSize(20);
        doc.text('ข้อมูลแผนการรักษาผู้ป่วย', 105, 20, { align: 'center' });

        // Patient Info
        doc.setFontSize(14);
        doc.text(`HN: ${selectedPatient.hn}`, 14, 35);
        doc.text(`ชื่อ-นามสกุล: ${selectedPatient.firstName} ${selectedPatient.lastName}`, 14, 42);

        // Details using autoTable for a structured layout
        autoTable(doc, {
            startY: 50,
            theme: 'grid',
            head: [['หัวข้อ', 'รายละเอียด']],
            body: [
                ['การวินิจฉัย (Diagnosis)', selectedPatient.diagnosis || 'ยังไม่มีข้อมูล'],
                ['วันที่วินิจฉัย', selectedPatient.diagnosisDate ? new Date(selectedPatient.diagnosisDate).toLocaleDateString('th-TH') : 'ยังไม่มีข้อมูล'],
                ['Stage', selectedPatient.stage || 'ยังไม่มีข้อมูล'],
                ['Prognosis', selectedPatient.prognosis || 'ยังไม่มีข้อมูล'],
                ['แผนการรักษา (Treatment Plan)', (selectedPatient.treatmentPlan && selectedPatient.treatmentPlan.details) || 'ยังไม่มีข้อมูล'],
            ],
            styles: { font: 'THSarabunNew', fontStyle: 'normal', cellPadding: 3, overflow: 'linebreak' },
            headStyles: { fillColor: [41, 128, 185], font: 'THSarabunNew' },
            columnStyles: {
                0: { cellWidth: 50 }, // Width for "หัวข้อ" column
                1: { cellWidth: 'auto' } // Width for "รายละเอียด" column
            }
        });

        doc.save(`treatment_plan_${selectedPatient.hn}.pdf`);
    };

    const exportExcel = () => {
        if (!selectedPatient) return;

        const worksheetData = [
            { 'หัวข้อ': 'HN', 'รายละเอียด': selectedPatient.hn },
            { 'หัวข้อ': 'ชื่อ-นามสกุล', 'รายละเอียด': `${selectedPatient.firstName} ${selectedPatient.lastName}` },
            { 'หัวข้อ': 'การวินิจฉัย (Diagnosis)', 'รายละเอียด': selectedPatient.diagnosis || 'ยังไม่มีข้อมูล' },
            { 'หัวข้อ': 'วันที่วินิจฉัย', 'รายละเอียด': selectedPatient.diagnosisDate ? new Date(selectedPatient.diagnosisDate).toLocaleDateString('th-TH') : 'ยังไม่มีข้อมูล' },
            { 'หัวข้อ': 'Stage', 'รายละเอียด': selectedPatient.stage || 'ยังไม่มีข้อมูล' },
            { 'หัวข้อ': 'Prognosis', 'รายละเอียด': selectedPatient.prognosis || 'ยังไม่มีข้อมูล' },
            { 'หัวข้อ': 'แผนการรักษา (Treatment Plan)', 'รายละเอียด': (selectedPatient.treatmentPlan && selectedPatient.treatmentPlan.details) || 'ยังไม่มีข้อมูล' },
        ];

        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'แผนการรักษา');
        
        // Auto-fit columns
        const colWidths = Object.keys(worksheetData[0]).map(key => ({
            wch: Math.max(...worksheetData.map(row => row[key]?.toString().length ?? 10))
        }));
        worksheet['!cols'] = colWidths;

        XLSX.writeFile(workbook, `treatment_plan_${selectedPatient.hn}.xlsx`);
    };

    const openEditModal = (patient) => {
        setSelectedPatient(patient);
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedPatient(null);
    };

    const openReadMoreModal = (patient) => {
        setSelectedPatient(patient);
        setIsReadMoreModalOpen(true);
    };

    if (!canView) {
        return <h2>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</h2>;
    }

    return (
        <div className="patient-management-container">
            <div className="page-header">
                <h1>แผนการรักษา</h1>
            </div>

            <div className="treatment-layout">
                <div className="search-panel">
                    <div className="content-card">
                        <div className="card-header">
                           <h3>ค้นหาผู้ป่วย</h3>
                        </div>
                        <div className="card-body">
                            <div className="form-group">
                                <label>ค้นหาด้วย HN หรือ ชื่อ-นามสกุล:</label>
                                <input 
                                    type="text"
                                    placeholder="ค้นหา..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                             <div className="form-group">
                                <label>เลือกผู้ป่วยจากรายการ:</label>
                                <select 
                                    id="patient-select"
                                    onChange={(e) => handleSelectPatient(e.target.value)}
                                    value={selectedPatient ? selectedPatient.id : ''}
                                >
                                    <option value="">-- กรุณาเลือกผู้ป่วย --</option>
                                    {filteredPatients.map(p => (
                                        <option key={p.id} value={p.id}>{p.hn} - {p.firstName} {p.lastName}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="details-panel">
                    {selectedPatient ? (
                        <div className="content-card">
                            <div className="card-header">
                                <h3>ข้อมูลแผนการรักษาของ: {selectedPatient.firstName} {selectedPatient.lastName} (HN: {selectedPatient.hn})</h3>
                                <div className="header-actions">
                                     {canManage && (
                                        <button onClick={() => openEditModal(selectedPatient)} className="btn-edit">แก้ไขแผน</button>
                                     )}
                                     <button onClick={exportPatientPDF} className="btn-export">PDF</button>
                                     <button onClick={exportExcel} className="btn-export">Excel</button>
                                </div>
                            </div>
                            <div className="card-body">
                                <div className="treatment-details">
                                    <div className="detail-item"><strong>การวินิจฉัย:</strong> <span>{selectedPatient.diagnosis || '-'}</span></div>
                                    <div className="detail-item"><strong>วันที่วินิจฉัย:</strong> <span>{selectedPatient.diagnosisDate ? new Date(selectedPatient.diagnosisDate).toLocaleDateString('th-TH') : '-'}</span></div>
                                    <div className="detail-item"><strong>Stage:</strong> <span>{selectedPatient.stage || '-'}</span></div>
                                    <div className="detail-item"><strong>Prognosis:</strong> <span>{selectedPatient.prognosis || '-'}</span></div>
                                    <div className="detail-item"><strong>สรุปสถานะการรักษา:</strong> <span>{(() => {
                                        const s = selectedPatient.treatmentPlan?.currentStatus;
                                        if (s === 'first') return 'First treatment';
                                        if (s === 'cr') return 'Complete remission (CR)';
                                        if (s === 'pr') return 'Partial remission (PR)';
                                        if (s === 'relapsed') return `Relapsed${selectedPatient.treatmentPlan?.relapsedNumber ? `: ${selectedPatient.treatmentPlan.relapsedNumber}` : ''}`;
                                        if (s === 'refractory') return 'Refractory/Progression disease';
                                        if (s === 'palliative') return 'Palliative care';
                                        return '-';
                                    })()}</span></div>
                                    <div className="detail-item"><strong>กลุ่มการวินิจฉัย:</strong> <span>{(() => {
                                        const g = selectedPatient.treatmentPlan?.diagnosisGroup;
                                        if (g === 'indolent') return 'Low grade (Indolent) lymphoma';
                                        if (g === 'cll') return 'Chronic lymphocytic leukemia';
                                        if (g === 'aggressive') return 'High grade (aggressive) lymphoma';
                                        if (g === 'plasma') return 'Plasma cell neoplasm';
                                        if (g === 'mds') return 'MDS';
                                        if (g === 'mpnmds') return 'MPN/MDS';
                                        if (g === 'mpn') return 'MPN';
                                        if (g === 'cml') return 'CML';
                                        if (g === 'acute') return 'Acute leukemia';
                                        if (g === 'otherhemo') return 'Other hematologic disease';
                                        if (g === 'other') return 'Other...';
                                        return '-';
                                    })()}</span></div>
                                    <div className="detail-item wide">
                                        <strong>เอกสารแนบเพิ่มเติม:</strong>
                                        {(selectedPatient.attachments && selectedPatient.attachments.length > 0) ? (
                                            <ul className="attachment-list-display">
                                                {selectedPatient.attachments.map((att, index) => (
                                                    <li key={index}>
                                                        <a href={`${API_BASE_URL}/${att.path}`} target="_blank" rel="noopener noreferrer">{att.name}</a>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <span>ไม่มีไฟล์แนบ</span>
                                        )}
                                    </div>
                                    <div className="detail-item wide">
                                        <strong>แผนการรักษา:</strong>
                                        <div className="treatment-plan-box truncated-text">
                                            <p>
                                                {(selectedPatient.treatmentPlan?.details && selectedPatient.treatmentPlan.details.substring(0, 200)) || '-'}
                                                {selectedPatient.treatmentPlan?.details && selectedPatient.treatmentPlan.details.length > 200 && '...'}
                                            </p>
                                        </div>
                                        {canManage && selectedPatient.treatmentPlan?.details && (
                                            <button onClick={() => {
                                                setIsFullScreenModalOpen(true);
                                                setIsFullScreenEdit(true);
                                                setFullScreenEditValue(selectedPatient.treatmentPlan.details || '');
                                            }} className="btn-link">
                                                แก้ไขแผนการรักษาแบบเต็มจอ
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                         <div className="content-card empty-state">
                            <p>กรุณาเลือกผู้ป่วยเพื่อดูแผนการรักษา</p>
                        </div>
                    )}
                </div>
            </div>

            {isEditModalOpen && selectedPatient && (
                <Modal onClose={closeEditModal} title={`แก้ไขแผนการรักษาของ ${selectedPatient.firstName}`}>
                    <TreatmentForm 
                        patient={selectedPatient} 
                        onSave={handleSaveTreatment}
                        onCancel={closeEditModal} 
                        onAttachmentDelete={handleAttachmentDelete}
                    />
                </Modal>
            )}

            {isReadMoreModalOpen && selectedPatient && (
                 <Modal 
                    onClose={() => setIsReadMoreModalOpen(false)} 
                    title={`แผนการรักษาของ ${selectedPatient.firstName}`}
                    size="lg"
                 >
                    <div className="full-details-content">
                        <pre>{selectedPatient.treatmentPlan?.details}</pre>
                    </div>
                </Modal>
            )}

            {isFullScreenModalOpen && (
                <div className="fullscreen-modal-overlay">
                    <div className="fullscreen-modal-content">
                        <button className="close-btn" onClick={() => setIsFullScreenModalOpen(false)}>×</button>
                        <h2>แผนการรักษาของ {selectedPatient.firstName}</h2>
                        {isFullScreenEdit ? (
                            <>
                                <textarea
                                    className="treatment-full-textarea"
                                    value={fullScreenEditValue}
                                    onChange={e => setFullScreenEditValue(e.target.value)}
                                    style={{ width: '100%', height: '65vh', fontSize: '1.2rem', padding: '1.5rem', borderRadius: '12px', marginTop: '2rem' }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                                    <button className="btn-secondary" onClick={() => setIsFullScreenModalOpen(false)}>ยกเลิก</button>
                                    <button className="btn-primary" onClick={async () => {
                                        // เรียก API อัปเดตแผนการรักษา
                                        const token = localStorage.getItem('token');
                                        const response = await fetch(`${API_BASE_URL}/api/patients/id/${selectedPatient.id}`, {
                                            method: 'PUT',
                                            headers: { 'Authorization': `Bearer ${token}` },
                                            body: (() => {
                                                const formData = new FormData();
                                                formData.append('treatmentPlan', JSON.stringify({ details: fullScreenEditValue }));
                                                // ส่งเฉพาะฟิลด์ treatmentPlan
                                                return formData;
                                            })(),
                                        });
                                        if (response.ok) {
                                            const updatedPatient = await response.json();
                                            setPatients(patients.map(p => p.id === updatedPatient.id ? updatedPatient : p));
                                            setSelectedPatient(updatedPatient);
                                            setIsFullScreenModalOpen(false);
                                        } else {
                                            alert('เกิดข้อผิดพลาดในการบันทึก');
                                        }
                                    }}>บันทึก</button>
                                </div>
                            </>
                        ) : (
                            <pre className="treatment-full-content">
                                {selectedPatient.treatmentPlan?.details}
                            </pre>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}