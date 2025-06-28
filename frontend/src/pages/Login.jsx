import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/Login.css';

const Login = () => {
  const [hn, setHn] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Log component mount
  React.useEffect(() => {
    console.log('📱 Login page mounted');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('📝 Login form submitted:', {
      username: hn,
      hasPassword: !!password,
      passwordLength: password.length,
      timestamp: new Date().toISOString()
    });
    
    setError('');
    try {
      console.log('🔄 Starting login process...');
      await login(hn, password);
      console.log('✅ Login successful, navigating to dashboard');
      navigate('/dashboard');
    } catch (err) {
      console.error('❌ Login error in component:', {
        message: err.message,
        error: err
      });
      setError(err.message || 'Failed to login. Please check your credentials.');
    }
  };

  const handleInputChange = (field, value) => {
    console.log(`✏️ Input changed - ${field}:`, {
      value: field === 'password' ? '*'.repeat(value.length) : value,
      length: value.length
    });
    
    if (field === 'hn') {
      setHn(value);
    } else if (field === 'password') {
      setPassword(value);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
            <img src="/logo.png" alt="Hospital Logo" className="login-logo"/>
            <h2>แผนกอายุรกรรม</h2>
            <h2>โรงพยาบาลสงฆ์</h2>
            <p>กรุณาลงชื่อเข้าใช้เพื่อเข้าสู่ระบบ</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <>
              <p className="error-message">{error}</p>
              {console.error('🚨 Login error displayed:', error)}
            </>
          )}
          <div className="input-group">
            <label htmlFor="hn">Username หรือ Email</label>
            <input
              type="text"
              id="hn"
              value={hn}
              onChange={(e) => handleInputChange('hn', e.target.value)}
              placeholder="กรอก Username หรือ Email"
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">รหัสผ่าน</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="กรอกรหัสผ่าน"
              required
            />
          </div>
          <button 
            type="submit" 
            className="login-button"
            onClick={() => console.log('🔘 Login button clicked')}
          >
            ลงชื่อเข้าใช้
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login; 