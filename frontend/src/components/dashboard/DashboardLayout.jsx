import React, { useState } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { 
    FiUsers, FiLayout, FiFileText, FiCalendar, FiSettings, 
    FiChevronDown, FiBell, FiPlus, FiLogOut, FiBriefcase, FiBarChart2 
} from 'react-icons/fi';

// Import Pages
import PatientManagement from '../../pages/PatientManagement';
import AppointmentDashboard from '../../pages/AppointmentDashboard';
import TreatmentPage from '../../pages/TreatmentPage';
import ChemoWardDashboard from '../../pages/ChemoWardDashboard';
import SettingsPage from '../../pages/SettingsPage';
import StatisticsPage from '../../pages/StatisticsPage';

// Sidebar Component
const Sidebar = ({ user, logout }) => {
    const navLinks = [
        { path: "/dashboard", label: "แดชบอร์ดเคมีบำบัด", icon: FiLayout, roles: ['ADMIN', 'DOCTOR', 'NURSE'] },
        { path: "/patients", label: "จัดการข้อมูลผู้ป่วย", icon: FiUsers, roles: ['ADMIN', 'DOCTOR', 'NURSE'] },
        { path: "/appointments", label: "การนัดหมาย", icon: FiCalendar, roles: ['ADMIN', 'DOCTOR', 'NURSE'] },
        { path: "/treatments", label: "แผนการรักษา", icon: FiBriefcase, roles: ['ADMIN', 'DOCTOR', 'NURSE'] },
        { path: "/statistics", label: "สถิติและรายงาน", icon: FiBarChart2, roles: ['ADMIN', 'DOCTOR', 'NURSE'] },
        { path: "/settings", label: "การตั้งค่า", icon: FiSettings, roles: ['ADMIN'] },
    ];
    
    const accessibleLinks = navLinks.filter(link => link.roles.includes(user?.role));

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="hospital-logo">
                    <FiBriefcase /> 
                </div>
                <div className="hospital-info">
                    <h2>โรงพยาบาลสงฆ์</h2>
                    <p>ระบบโลหิตวิทยา</p>
                </div>
            </div>
            
            <div className="user-profile">
                <FiUsers className="user-icon"/>
                <div className="user-details">
                    <span>{user?.name || 'ผู้ใช้'}</span>
                    <div className="user-role-tag">{user?.role}</div>
                </div>
            </div>

            <nav className="sidebar-nav">
                {accessibleLinks.map(({ path, label, icon: Icon }) => (
                    <NavLink key={path} to={path} className="nav-link">
                        <Icon className="nav-icon" />
                        <span>{label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <button onClick={logout} className="btn-logout">
                    <FiLogOut />
                    <span>ออกจากระบบ</span>
                </button>
            </div>
        </aside>
    );
};

// Main Header Component
const MainHeader = ({ pageTitle }) => {
    const currentDate = new Date().toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    return (
        <header className="main-header">
            <div className="page-title">
                <h1>{pageTitle}</h1>
                <p>วันที่ {currentDate}</p>
            </div>
        </header>
    );
};

export default function DashboardLayout() {
    const { user, logout } = React.useContext(AuthContext);
    const [pageTitle, setPageTitle] = useState("เคมีบำบัด อายุรกรรม โรงพยาบาลสงฆ์");

    // In a real app, you'd likely derive this from the route
    const handleSetTitle = (title) => {
        setPageTitle(title);
    };
    
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="dashboard-layout">
            <Sidebar user={user} logout={logout} />
            <div className="main-content-wrapper">
                <MainHeader pageTitle={pageTitle} />
                <main className="main-content">
                    <Routes>
                        <Route path="/dashboard" element={<ChemoWardDashboard />} />
                        <Route path="/patients" element={<PatientManagement />} />
                        <Route path="/appointments" element={<AppointmentDashboard />} />
                        <Route path="/treatments" element={<TreatmentPage />} />
                        <Route path="/statistics" element={<StatisticsPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
} 