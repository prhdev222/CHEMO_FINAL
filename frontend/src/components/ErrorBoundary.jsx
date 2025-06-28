import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('🚨 React Error Boundary caught an error:', {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      errorInfo: {
        componentStack: errorInfo.componentStack
      },
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    });

    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // You can also log the error to an error reporting service here
    // logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div style={{
          padding: '20px',
          margin: '20px',
          border: '1px solid #ff6b6b',
          borderRadius: '8px',
          backgroundColor: '#fff5f5',
          color: '#d63031'
        }}>
          <h2>🚨 เกิดข้อผิดพลาดในระบบ</h2>
          <p>ขออภัย เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองรีเฟรชหน้าเว็บ</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#ff6b6b',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            รีเฟรชหน้าเว็บ
          </button>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ marginTop: '20px' }}>
              <summary>รายละเอียดข้อผิดพลาด (สำหรับนักพัฒนา)</summary>
              <pre style={{
                backgroundColor: '#f8f9fa',
                padding: '10px',
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '12px'
              }}>
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 