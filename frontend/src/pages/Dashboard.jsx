import React, { useEffect, useState, useContext } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../assets/fonts/THSarabunNew-normal.js';
import { AuthContext } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

export default function Dashboard() {
  const [patients, setPatients] = useState([]);
  const [hn, setHn] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const { token } = useContext(AuthContext);

  // Log component mount
  useEffect(() => {
    console.log('🏠 Dashboard mounted');
    console.log('🔑 Auth token available:', !!token);
  }, []);

  const fetchPatients = () => {
    if (!token) {
      console.warn('⚠️ No token available for fetching patients');
      return;
    }
    
    console.log('📡 Fetching patients from API...');
    fetch(`${API_URL}/api/patients`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        console.log('📊 Patients API response:', {
          status: res.status,
          statusText: res.statusText,
          ok: res.ok
        });
        return res.json();
      })
      .then(data => {
        if (data.error) {
          console.error('❌ Error fetching patients:', data.error);
          setPatients([]);
        } else {
          console.log('✅ Patients fetched successfully:', {
            count: data.length,
            patients: data.map(p => ({ hn: p.hn, name: `${p.firstName} ${p.lastName}` }))
          });
          setPatients(data);
        }
      })
      .catch(error => {
        console.error('💥 Error in fetchPatients:', error);
        setPatients([]);
      });
  };

  useEffect(() => {
    console.log('🔄 Token changed, refetching patients');
    fetchPatients();
  }, [token]);

  // ดึงข้อมูลผู้ป่วยตาม HN
  const handleSearch = () => {
    if (!token || !hn) {
      console.warn('⚠️ Search skipped:', { hasToken: !!token, hasHn: !!hn });
      return;
    }
    
    console.log('🔍 Searching for patient:', { hn });
    fetch(`${API_URL}/api/patients/${hn}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        console.log('📡 Patient search API response:', {
          status: res.status,
          statusText: res.statusText,
          ok: res.ok
        });
        return res.json();
      })
      .then(data => {
        if (data.error) {
          console.error('❌ Patient search error:', data.error);
          setSelectedPatient(null);
        } else {
          console.log('✅ Patient found:', {
            hn: data.hn,
            name: `${data.firstName} ${data.lastName}`,
            diagnosis: data.diagnosis
          });
          setSelectedPatient(data);
        }
      })
      .catch(error => {
        console.error('💥 Error in patient search:', error);
        setSelectedPatient(null);
      });
  };

  // ฟังก์ชัน export PDF
  const exportPDF = () => {
    console.log('📄 Exporting PDF:', {
      patientCount: patients.length,
      timestamp: new Date().toISOString()
    });
    
    try {
      const doc = new jsPDF();
      doc.setFont('THSarabunNew');
      doc.setFontSize(16);
      doc.text('รายชื่อผู้ป่วย', 14, 16);
      autoTable(doc, {
        startY: 22,
        head: [['HN', 'ชื่อ', 'นามสกุล', 'การวินิจฉัย']],
        body: patients.map(p => [p.hn, p.firstName, p.lastName, p.diagnosis]),
        styles: { font: 'THSarabunNew', fontStyle: 'normal', fontSize: 14 },
        headStyles: { font: 'THSarabunNew', fontStyle: 'normal', fontSize: 14 }
      });
      doc.save('patients.pdf');
      console.log('✅ PDF exported successfully');
    } catch (error) {
      console.error('💥 PDF export error:', error);
    }
  };

  const handleHnChange = (value) => {
    console.log('✏️ HN input changed:', { value, length: value.length });
    setHn(value);
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>แดชบอร์ดผู้ป่วย (Demo)</h1>
      <div style={{ marginBottom: 16 }}>
        <input
          value={hn}
          onChange={e => handleHnChange(e.target.value)}
          placeholder="ค้นหา HN ผู้ป่วย"
        />
        <button 
          onClick={() => {
            console.log('🔍 Search button clicked');
            handleSearch();
          }}
        >
          ค้นหา
        </button>
      </div>
      {selectedPatient && (
        <div style={{ border: '1px solid #ccc', padding: 16, marginBottom: 16 }}>
          <h2>ข้อมูลผู้ป่วย HN: {selectedPatient.hn}</h2>
          <div>ชื่อ: {selectedPatient.firstName} {selectedPatient.lastName}</div>
          <div>การวินิจฉัย: {selectedPatient.diagnosis}</div>
          <div>แผนการรักษา: {JSON.stringify(selectedPatient.treatmentPlan)}</div>
        </div>
      )}
      <h2>รายชื่อผู้ป่วยทั้งหมด ({patients.length} คน)</h2>
      <button 
        onClick={() => {
          console.log('📄 Export PDF button clicked');
          exportPDF();
        }} 
        style={{ marginBottom: 8 }}
      >
        Export PDF
      </button>
      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>HN</th>
            <th>ชื่อ</th>
            <th>นามสกุล</th>
            <th>การวินิจฉัย</th>
          </tr>
        </thead>
        <tbody>
          {patients.map(p => (
            <tr key={p.hn}>
              <td>{p.hn}</td>
              <td>{p.firstName}</td>
              <td>{p.lastName}</td>
              <td>{p.diagnosis}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 