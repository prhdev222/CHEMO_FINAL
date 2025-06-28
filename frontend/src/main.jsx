import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import './styles/global.css'

// Import debug utilities
import './utils/debug.js'
import './utils/api.js'

// Global logging setup
console.log('🚀 Application starting...', {
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent,
  nodeEnv: import.meta.env.MODE
});

// Log when React app is mounted
const logAppMount = () => {
  console.log('✅ React app mounted successfully');
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)

// Log after render
setTimeout(logAppMount, 100);
