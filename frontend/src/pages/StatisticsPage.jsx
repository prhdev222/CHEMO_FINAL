import React, { useState, useEffect, useContext } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AuthContext } from '../context/AuthContext';
import '../styles/statistics.css';
import '../assets/fonts/THSarabunNew-normal.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const StatisticsPage = () => {
  const { token } = useContext(AuthContext);
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [selectedPatients, setSelectedPatients] = useState([]);
  const [chartType, setChartType] = useState('bar');
  const [timeRange, setTimeRange] = useState('3');
  const [searchHN, setSearchHN] = useState('');
  const [diagnosisFilter, setDiagnosisFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [error, setError] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [showPieModal, setShowPieModal] = useState(false);
  const [admitFilter, setAdmitFilter] = useState('all');
  const [newPatientFilter, setNewPatientFilter] = useState('all');

  // ข้อมูลกลุ่มการวินิจฉัยจาก TreatmentPage
  const diagnosisGroups = [
    { value: 'indolent', label: 'Low grade (Indolent) lymphoma' },
    { value: 'cll', label: 'Chronic lymphocytic leukemia' },
    { value: 'aggressive', label: 'High grade (aggressive) lymphoma' },
    { value: 'plasma', label: 'Plasma cell neoplasm' },
    { value: 'mds', label: 'MDS' },
    { value: 'mpnmds', label: 'MPN/MDS' },
    { value: 'mpn', label: 'MPN' },
    { value: 'cml', label: 'CML' },
    { value: 'acute', label: 'Acute leukemia' },
    { value: 'otherhemo', label: 'Other hematologic disease' },
    { value: 'other', label: 'Other...' }
  ];

  // สร้างข้อมูลกราฟจากข้อมูลจริง
  const generateChartData = () => {
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const currentDate = new Date();
    const monthCount = parseInt(timeRange);
    
    // สร้างข้อมูลผู้ป่วยใหม่ตามเดือน
    const newPatientsData = new Array(monthCount).fill(0);
    
    // นับผู้ป่วยใหม่
    patients.forEach(patient => {
      if (patient.createdAt) {
        const createdDate = new Date(patient.createdAt);
        const monthDiff = (currentDate.getFullYear() - createdDate.getFullYear()) * 12 + 
                         (currentDate.getMonth() - createdDate.getMonth());
        
        if (monthDiff < monthCount) {
          const monthIndex = monthCount - monthDiff - 1;
          if (monthIndex >= 0 && monthIndex < monthCount) {
            newPatientsData[monthIndex]++;
          }
        }
      }
    });

    // ถ้าไม่มีข้อมูลผู้ป่วย ให้ใช้ข้อมูลจำลอง
    if (patients.length === 0) {
      // ข้อมูลจำลองสำหรับทดสอบ
      for (let i = 0; i < monthCount; i++) {
        newPatientsData[i] = Math.floor(Math.random() * 3) + 1; // 1-3 คน
      }
    }

    const labels = months.slice(-monthCount);
    
    return {
      labels,
      datasets: [
        {
          label: 'ผู้ป่วยใหม่',
          data: newPatientsData,
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  const chartData = generateChartData();

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `สถิติผู้ป่วย ${timeRange} เดือนล่าสุด`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 5,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [patients, searchHN, diagnosisFilter, admitFilter, newPatientFilter]);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/patients', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPatients(data);
        setFilteredPatients(data);
      } else {
        console.error('Failed to fetch patients:', response.status);
        setError('ไม่สามารถดึงข้อมูลผู้ป่วยได้');
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/appointments', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAppointments(Array.isArray(data) ? data : []);
      } else {
        setAppointments([]);
      }
    } catch (error) {
      setAppointments([]);
    }
  };

  const filterPatients = () => {
    let filtered = patients;

    if (searchHN) {
      filtered = filtered.filter(patient => 
        patient.hn?.toLowerCase().includes(searchHN.toLowerCase())
      );
    }

    if (diagnosisFilter) {
      filtered = filtered.filter(patient => 
        patient.treatmentPlan?.diagnosisGroup === diagnosisFilter
      );
    }

    // กรองตาม admit filter
    if (admitFilter !== 'all') {
      const now = new Date();
      const months = parseInt(admitFilter);
      filtered = filtered.filter(patient => {
        // หา appointment admit ล่าสุดของผู้ป่วยนี้ (ที่มี admitDate)
        const admitAppointments = appointments.filter(
          apt => apt.patientId === patient.id && apt.admitDate
        );
        if (admitAppointments.length === 0) return false;
        // หา admit ล่าสุด
        const latestAdmit = admitAppointments.reduce((a, b) => new Date(a.admitDate) > new Date(b.admitDate) ? a : b);
        const admitDate = new Date(latestAdmit.admitDate);
        const diffMonth = (now.getFullYear() - admitDate.getFullYear()) * 12 + (now.getMonth() - admitDate.getMonth());
        return diffMonth < months;
      });
    }

    // กรองตามผู้ป่วยใหม่ (newPatientFilter)
    if (newPatientFilter !== 'all') {
      const now = new Date();
      const months = parseInt(newPatientFilter);
      filtered = filtered.filter(patient => {
        if (!patient.createdAt) return false;
        const createdDate = new Date(patient.createdAt);
        const diffMonth = (now.getFullYear() - createdDate.getFullYear()) * 12 + (now.getMonth() - createdDate.getMonth());
        return diffMonth < months;
      });
    }

    setFilteredPatients(filtered);
  };

  const handleSelectPatient = (patientId) => {
    setSelectedPatients(prev => 
      prev.includes(patientId) 
        ? prev.filter(id => id !== patientId)
        : [...prev, patientId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPatients.length === filteredPatients.length) {
      setSelectedPatients([]);
    } else {
      setSelectedPatients(filteredPatients.map(p => p.id));
    }
  };

  const exportData = async (format) => {
    const selectedData = patients.filter(p => selectedPatients.includes(p.id));
    
    if (format === 'csv') {
      exportToCSV(selectedData);
    } else if (format === 'pdf') {
      exportToPDF(selectedData);
    }
  };

  const exportToCSV = (data) => {
    const headers = [
      'HN', 'ชื่อ', 'นามสกุล', 'Line ID', 'ที่อยู่', 'วันเกิด', 
      'การวินิจฉัย', 'วันที่วินิจฉัย', 'Staging', 'Prognosis', 'กลุ่มการวินิจฉัย',
      'รายละเอียดแผนการรักษา', 'สถานะการรักษา', 'สถานะผู้ป่วย', 'วันที่ลงทะเบียน',
      'วันที่ admit ล่าสุด', 'Chemotherapy Regimen ล่าสุด', 'ประวัติ admit/discharge'
    ];
    
    const csvContent = [
      headers.join(','),
      ...data.map(patient => {
        const treatmentPlan = patient.treatmentPlan || {};
        const diagnosisGroup = diagnosisGroups.find(g => g.value === treatmentPlan.diagnosisGroup)?.label || '';
        // ประวัติ admit/discharge
        const patientAdmits = appointments.filter(a => a.patientId === patient.id && a.admitDate);
        // admit ล่าสุด
        let latestAdmit = null;
        if (patientAdmits.length > 0) {
          latestAdmit = patientAdmits.reduce((a, b) => new Date(a.admitDate) > new Date(b.admitDate) ? a : b);
        }
        const admitHistory = patientAdmits.map((a, idx) => {
          const admit = a.admitDate ? new Date(a.admitDate).toLocaleDateString('th-TH') : '';
          const discharge = a.dischargeDate ? new Date(a.dischargeDate).toLocaleDateString('th-TH') : '';
          let days = '';
          if (a.admitDate && a.dischargeDate) {
            const d1 = new Date(a.admitDate);
            const d2 = new Date(a.dischargeDate);
            days = Math.max(1, Math.round((d2 - d1) / (1000*60*60*24)) + 1);
          }
          return `ครั้งที่${idx+1}: ${admit} - ${discharge} | Regimen: ${a.chemoRegimen || '-'} | ${days ? days + ' วัน' : ''}`;
        }).join(' | ');
        return [
          patient.hn || '',
          patient.firstName || '',
          patient.lastName || '',
          patient.lineId || '',
          `"${patient.address || ''}"`,
          patient.birthDate ? new Date(patient.birthDate).toLocaleDateString('th-TH') : '',
          patient.diagnosis || '',
          patient.diagnosisDate ? new Date(patient.diagnosisDate).toLocaleDateString('th-TH') : '',
          patient.stage || '',
          patient.prognosis || '',
          diagnosisGroup,
          `"${treatmentPlan.details || ''}"`,
          treatmentPlan.currentStatus || '',
          patient.status || '',
          patient.createdAt ? new Date(patient.createdAt).toLocaleDateString('th-TH') : '',
          latestAdmit && latestAdmit.admitDate ? new Date(latestAdmit.admitDate).toLocaleDateString('th-TH') : '',
          latestAdmit && latestAdmit.chemoRegimen ? latestAdmit.chemoRegimen : '',
          `"${admitHistory}"`
        ].join(',');
      })
    ].join('\n');

    // เพิ่ม BOM เพื่อรองรับภาษาไทยใน Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `patients_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // ฟังก์ชันโหลดฟอนต์จาก public เป็น base64
  const loadFontBase64 = async (url) => {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const exportToPDF = (data) => {
    const doc = new jsPDF();
    doc.setFont('THSarabunNew');

    const fields = [
      { label: 'HN', key: 'hn' },
      { label: 'ชื่อ', key: 'firstName' },
      { label: 'นามสกุล', key: 'lastName' },
      { label: 'Line ID', key: 'lineId' },
      { label: 'ที่อยู่', key: 'address' },
      { label: 'วันเกิด', key: 'birthDate', format: v => v ? new Date(v).toLocaleDateString('th-TH') : '' },
      { label: 'การวินิจฉัย', key: 'diagnosis' },
      { label: 'วันที่วินิจฉัย', key: 'diagnosisDate', format: v => v ? new Date(v).toLocaleDateString('th-TH') : '' },
      { label: 'Staging', key: 'stage' },
      { label: 'Prognosis', key: 'prognosis' },
      { label: 'กลุ่มการวินิจฉัย', key: 'diagnosisGroup', format: v => diagnosisGroups.find(g => g.value === v)?.label || '' },
      { label: 'รายละเอียดแผนการรักษา', key: 'details', from: 'treatmentPlan' },
      { label: 'สถานะการรักษา', key: 'currentStatus', from: 'treatmentPlan' },
      { label: 'สถานะผู้ป่วย', key: 'status' },
      { label: 'วันที่ลงทะเบียน', key: 'createdAt', format: v => v ? new Date(v).toLocaleDateString('th-TH') : '' },
    ];

    data.forEach((patient, idx) => {
      doc.setFont('THSarabunNew');
      doc.setFontSize(20);
      doc.text('รายงานข้อมูลผู้ป่วย', 15, 20, { align: 'left' });
      doc.setFontSize(12);
      doc.text(`วันที่: ${new Date().toLocaleDateString('th-TH')}`, 15, 30, { align: 'left' });
      doc.text(`ลำดับที่: ${idx + 1} จาก ${data.length}`, 15, 38, { align: 'left' });

      const formRows = fields.map(f => {
        let value = '';
        if (f.from === 'treatmentPlan') {
          value = patient.treatmentPlan?.[f.key] || '';
        } else if (f.key === 'diagnosisGroup') {
          value = f.format ? f.format(patient.treatmentPlan?.diagnosisGroup) : (patient.treatmentPlan?.diagnosisGroup || '');
        } else if (f.format) {
          value = f.format(patient[f.key]);
        } else {
          value = patient[f.key] || '';
        }
        return [f.label, value];
      });

      // เพิ่มประวัติ admit/discharge เป็นตารางย่อย
      const patientAdmits = appointments.filter(a => a.patientId === patient.id && a.admitDate);
      if (patientAdmits.length > 0) {
        formRows.push(['', '']);
        formRows.push(['ประวัติ admit/discharge', '']);
      }

      doc.setFont('THSarabunNew');
      autoTable(doc, {
        startY: 50,
        head: [],
        body: formRows,
        theme: 'plain',
        styles: {
          font: 'THSarabunNew',
          fontSize: 14,
          cellPadding: 2,
        },
        margin: { left: 30, right: 30 },
        didDrawCell: (data) => {
          // เพิ่มเส้นใต้แต่ละแถว
          const { table, cell } = data;
          if (cell.section === 'body') {
            const doc = data.doc;
            const { x, y, width, height } = cell;
            doc.setDrawColor(220);
            doc.line(x, y + height, x + width, y + height);
          }
        }
      });

      // ตารางย่อย admit/discharge
      if (patientAdmits.length > 0) {
        const admitTable = [
          ['ครั้งที่', 'วันที่ Admit', 'วันที่ Discharge', 'Chemotherapy Regimen', 'จำนวนวันนอน (วัน)'],
          ...patientAdmits.map((a, i) => {
            const admit = a.admitDate ? new Date(a.admitDate).toLocaleDateString('th-TH') : '';
            const discharge = a.dischargeDate ? new Date(a.dischargeDate).toLocaleDateString('th-TH') : '';
            let days = '';
            if (a.admitDate && a.dischargeDate) {
              const d1 = new Date(a.admitDate);
              const d2 = new Date(a.dischargeDate);
              days = Math.max(1, Math.round((d2 - d1) / (1000*60*60*24)) + 1);
            }
            return [`${i+1}`, admit, discharge, a.chemoRegimen || '', days ? `${days}` : ''];
          })
        ];
        autoTable(doc, {
          startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 6 : 60,
          head: [admitTable[0]],
          body: admitTable.slice(1),
          theme: 'grid',
          styles: {
            font: 'THSarabunNew',
            fontSize: 14,
            cellPadding: 2,
          },
          headStyles: {
            font: 'THSarabunNew',
            fontSize: 14,
            fontStyle: 'normal',
            fillColor: [255,255,255],
            textColor: 20,
          },
          bodyStyles: {
            font: 'THSarabunNew',
            fontSize: 14,
            fontStyle: 'normal',
          },
          margin: { left: 40, right: 40 },
        });
      }

      if (idx < data.length - 1) doc.addPage();
    });

    doc.save(`patients_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const renderChart = () => {
    return <Bar data={chartData} options={chartOptions} />;
  };

  // สร้างสถิติข้อมูลรวม
  const generateSummaryStats = () => {
    const totalPatients = patients.length;
    const activePatients = patients.filter(p => p.status === 'ACTIVE').length;
    const newThisMonth = patients.filter(p => {
      const createdAt = new Date(p.createdAt);
      const now = new Date();
      return createdAt.getMonth() === now.getMonth() && 
             createdAt.getFullYear() === now.getFullYear();
    }).length;

    // สถิติตามกลุ่มการวินิจฉัย
    const diagnosisStats = {};
    patients.forEach(patient => {
      const diagnosisGroup = patient.treatmentPlan?.diagnosisGroup;
      if (diagnosisGroup) {
        diagnosisStats[diagnosisGroup] = (diagnosisStats[diagnosisGroup] || 0) + 1;
      }
    });

    return { totalPatients, activePatients, newThisMonth, diagnosisStats };
  };

  const summaryStats = generateSummaryStats();

  // ฟังก์ชันสร้างข้อมูลกราฟผู้ป่วยใหม่
  const generateNewPatientsChartData = () => {
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const currentDate = new Date();
    const monthCount = parseInt(timeRange);
    const newPatientsData = new Array(monthCount).fill(0);
    patients.forEach(patient => {
      if (patient.createdAt) {
        const createdDate = new Date(patient.createdAt);
        const monthDiff = (currentDate.getFullYear() - createdDate.getFullYear()) * 12 + (currentDate.getMonth() - createdDate.getMonth());
        if (monthDiff < monthCount) {
          const monthIndex = monthCount - monthDiff - 1;
          if (monthIndex >= 0 && monthIndex < monthCount) {
            newPatientsData[monthIndex]++;
          }
        }
      }
    });
    if (patients.length === 0) {
      for (let i = 0; i < monthCount; i++) {
        newPatientsData[i] = Math.floor(Math.random() * 3) + 1;
      }
    }
    const labels = months.slice(-monthCount);
    return {
      labels,
      datasets: [
        {
          label: 'ผู้ป่วยใหม่',
          data: newPatientsData,
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  // ฟังก์ชันสร้างข้อมูลกราฟเปรียบเทียบผู้ป่วยใหม่และ admit
  const generateCombinedChartData = () => {
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const currentDate = new Date();
    const monthCount = parseInt(timeRange);
    const newPatientsData = new Array(monthCount).fill(0);
    const admitPatientsData = new Array(monthCount).fill(0);

    // สร้าง labels เดือนย้อนหลังจากเดือนปัจจุบัน
    const labels = [];
    for (let i = monthCount - 1; i >= 0; i--) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      labels.push(months[d.getMonth()]);
    }

    // ผู้ป่วยใหม่
    patients.forEach(patient => {
      if (patient.createdAt) {
        const createdDate = new Date(patient.createdAt);
        const monthDiff = (currentDate.getFullYear() - createdDate.getFullYear()) * 12 + (currentDate.getMonth() - createdDate.getMonth());
        if (monthDiff < monthCount && monthDiff >= 0) {
          const monthIndex = monthCount - monthDiff - 1;
          if (monthIndex >= 0 && monthIndex < monthCount) {
            newPatientsData[monthIndex]++;
          }
        }
      }
    });
    // ผู้ป่วย admit
    appointments.forEach(appointment => {
      if (appointment.admitDate) {
        const admitDate = new Date(appointment.admitDate);
        const monthDiff = (currentDate.getFullYear() - admitDate.getFullYear()) * 12 + (currentDate.getMonth() - admitDate.getMonth());
        if (monthDiff < monthCount && monthDiff >= 0) {
          const monthIndex = monthCount - monthDiff - 1;
          if (monthIndex >= 0 && monthIndex < monthCount) {
            admitPatientsData[monthIndex]++;
          }
        }
      }
    });
    // ข้อมูลจำลองถ้าไม่มีข้อมูลจริง
    if (patients.length === 0) {
      for (let i = 0; i < monthCount; i++) {
        newPatientsData[i] = Math.floor(Math.random() * 3) + 1;
      }
    }
    if (appointments.length === 0) {
      for (let i = 0; i < monthCount; i++) {
        admitPatientsData[i] = Math.floor(Math.random() * 2) + 1;
      }
    }
    return {
      labels,
      datasets: [
        {
          label: 'ผู้ป่วยใหม่',
          data: newPatientsData,
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
        {
          label: 'ผู้ป่วย Admit',
          data: admitPatientsData,
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  // ฟังก์ชันสร้างข้อมูล Pie Chart กลุ่มโรค
  const generateDiagnosisPieChartData = () => {
    const groupCounts = {};
    patients.forEach(patient => {
      const group = patient.treatmentPlan?.diagnosisGroup;
      if (group) {
        groupCounts[group] = (groupCounts[group] || 0) + 1;
      }
    });
    const labels = Object.keys(groupCounts).map(
      key => diagnosisGroups.find(g => g.value === key)?.label || key
    );
    const data = Object.values(groupCounts);
    const backgroundColors = [
      '#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF', '#B2EBF2', '#FFB6B6', '#B6FFB6', '#B6B6FF'
    ];
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors.slice(0, labels.length),
        },
      ],
    };
  };

  return (
    <div className="statistics-page">
      <div className="statistics-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h1 style={{ margin: 0 }}>สถิติและรายงาน</h1>
          <button 
            className="btn btn-secondary"
            onClick={() => setShowPatientModal(true)}
            style={{ marginLeft: 8 }}
          >
            ดูข้อมูลรวม
          </button>
        </div>
      </div>

      <div className="statistics-content">
        <div className="chart-row" style={{ display: 'flex', gap: '32px', justifyContent: 'center', alignItems: 'flex-start', marginBottom: 32 }}>
          <div className="chart-container" style={{ flex: 1, minWidth: 0, maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h3 style={{ textAlign: 'left', margin: 0 }}>เปรียบเทียบจำนวนผู้ป่วยใหม่และผู้ป่วยAdmit ในโซนผู้ป่วยเคมีบำบัด</h3>
              <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} style={{ fontSize: 16, padding: '2px 8px', borderRadius: 6, border: '1px solid #ccc' }}>
                <option value="3">3 เดือน</option>
                <option value="6">6 เดือน</option>
                <option value="12">12 เดือน</option>
              </select>
            </div>
            <div style={{ width: '100%', height: 320 }}>
              <Bar data={generateCombinedChartData()} options={chartOptions} />
            </div>
          </div>
          <div className="chart-container" style={{ flex: 1, minWidth: 0, maxWidth: 300, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 style={{ textAlign: 'center' }}>สัดส่วนกลุ่มโรคที่วินิจฉัย (Pie Chart)</h3>
            <div style={{ width: 220, height: 220 }}>
              <Pie data={generateDiagnosisPieChartData()} />
            </div>
            <button className="btn btn-secondary" style={{ marginTop: 12 }} onClick={() => setShowPieModal(true)}>
              ขยายดู Pie Chart
            </button>
          </div>
        </div>

        <div className="patient-section">
          <div className="section-header">
            <h2>รายชื่อผู้ป่วย</h2>
            <div className="filters" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="text"
                placeholder="ค้นหา HN..."
                value={searchHN}
                onChange={(e) => setSearchHN(e.target.value)}
                className="search-input"
              />
              <select 
                value={diagnosisFilter} 
                onChange={(e) => setDiagnosisFilter(e.target.value)}
                className="filter-select"
              >
                <option value="">ทุกกลุ่มการวินิจฉัย</option>
                {diagnosisGroups.map(group => (
                  <option key={group.value} value={group.value}>
                    {group.label}
                  </option>
                ))}
              </select>
              <select value={admitFilter} onChange={e => setAdmitFilter(e.target.value)} className="filter-select">
                <option value="all">ผู้ป่วยเคยadmitทั้งหมด</option>
                <option value="1">Admit 1 เดือน</option>
                <option value="3">Admit 3 เดือน</option>
                <option value="6">Admit 6 เดือน</option>
              </select>
              <select value={newPatientFilter} onChange={e => setNewPatientFilter(e.target.value)} className="filter-select">
                <option value="all">ผู้ป่วยใหม่ทั้งหมด</option>
                <option value="1">ผู้ป่วยใหม่ 1 เดือน</option>
                <option value="3">ผู้ป่วยใหม่ 3 เดือน</option>
                <option value="6">ผู้ป่วยใหม่ 6 เดือน</option>
              </select>
              <button 
                className="btn btn-primary"
                onClick={() => setShowExportModal(true)}
                disabled={selectedPatients.length === 0}
                style={{ marginLeft: 8 }}
              >
                Export ข้อมูล ({selectedPatients.length})
              </button>
            </div>
          </div>

          <div className="patient-table-container">
            {loading ? (
              <div className="loading">กำลังโหลดข้อมูล...</div>
            ) : error ? (
              <div className="error-message">
                <p>{error}</p>
                <button onClick={fetchPatients} className="btn btn-primary">ลองใหม่</button>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="no-data">
                <p>ไม่พบข้อมูลผู้ป่วย</p>
              </div>
            ) : (
              <table className="patient-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={selectedPatients.length === filteredPatients.length && filteredPatients.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th>HN</th>
                    <th>ชื่อ-นามสกุล</th>
                    <th>กลุ่มการวินิจฉัย</th>
                    <th>สถานะผู้ป่วย</th>
                    <th>วันที่ลงทะเบียน</th>
                    <th>วันที่ admit ล่าสุด</th>
                    <th>Chemotherapy Regimen ล่าสุด</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map(patient => (
                    <tr key={patient.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedPatients.includes(patient.id)}
                          onChange={() => handleSelectPatient(patient.id)}
                        />
                      </td>
                      <td>{patient.hn}</td>
                      <td>{`${patient.firstName || ''} ${patient.lastName || ''}`}</td>
                      <td>
                        {diagnosisGroups.find(g => g.value === patient.treatmentPlan?.diagnosisGroup)?.label || '-'}
                      </td>
                      <td>
                        <span className={`status-badge status-${patient.status?.toLowerCase()}`}>
                          {patient.status}
                        </span>
                      </td>
                      <td>
                        {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString('th-TH') : '-'}
                      </td>
                      <td>{(() => {
                        const admitAppointments = appointments.filter(apt => apt.patientId === patient.id && apt.admitDate);
                        if (admitAppointments.length === 0) return '-';
                        const latestAdmit = admitAppointments.reduce((a, b) => new Date(a.admitDate) > new Date(b.admitDate) ? a : b);
                        return latestAdmit.admitDate ? new Date(latestAdmit.admitDate).toLocaleDateString('th-TH') : '-';
                      })()}</td>
                      <td>{(() => {
                        const admitAppointments = appointments.filter(apt => apt.patientId === patient.id && apt.admitDate);
                        if (admitAppointments.length === 0) return '-';
                        const latestAdmit = admitAppointments.reduce((a, b) => new Date(a.admitDate) > new Date(b.admitDate) ? a : b);
                        return latestAdmit.chemoRegimen || '-';
                      })()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Export ข้อมูล</h3>
              <button onClick={() => setShowExportModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <p>เลือกผู้ป่วย {selectedPatients.length} คน</p>
              <div className="export-options">
                <button 
                  className="btn btn-primary"
                  onClick={() => exportData('csv')}
                >
                  Export เป็น CSV
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => exportData('pdf')}
                >
                  Export เป็น PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Patient Summary Modal */}
      {showPatientModal && (
        <div className="modal-overlay">
          <div className="modal large-modal">
            <div className="modal-header">
              <h3>ข้อมูลรวมผู้ป่วย</h3>
              <button onClick={() => setShowPatientModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="summary-stats">
                <div className="stat-card">
                  <h4>ผู้ป่วยทั้งหมด</h4>
                  <p className="stat-number">{summaryStats.totalPatients}</p>
                </div>
                <div className="stat-card">
                  <h4>ผู้ป่วย Active</h4>
                  <p className="stat-number">{summaryStats.activePatients}</p>
                </div>
                <div className="stat-card">
                  <h4>ผู้ป่วยใหม่ (เดือนนี้)</h4>
                  <p className="stat-number">{summaryStats.newThisMonth}</p>
                </div>
              </div>
              
              <div className="diagnosis-breakdown">
                <h4>แยกตามกลุ่มการวินิจฉัย</h4>
                <div className="diagnosis-list">
                  {Object.entries(summaryStats.diagnosisStats).map(([diagnosis, count]) => (
                    <div key={diagnosis} className="diagnosis-item">
                      <span>{diagnosisGroups.find(g => g.value === diagnosis)?.label || diagnosis}</span>
                      <span className="count">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pie Chart ใหญ่ */}
      {showPieModal && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal large-modal" style={{ maxWidth: 700, width: '90vw', padding: 32, background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.15)' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>สัดส่วนกลุ่มโรคที่วินิจฉัย (Pie Chart)</h2>
              <button onClick={() => setShowPieModal(false)} style={{ fontSize: 28, background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>&times;</button>
            </div>
            <div style={{ width: 500, height: 500, margin: '0 auto' }}>
              <Pie data={generateDiagnosisPieChartData()} options={{ plugins: { legend: { position: 'right', labels: { font: { size: 18 } } } } }} />
            </div>
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <button className="btn btn-primary" onClick={() => setShowPieModal(false)}>ปิดหน้าต่าง</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatisticsPage; 