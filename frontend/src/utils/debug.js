// Debug utility functions for development
// เวลาเรียกใช้งานด้วย import { logFormData, logUserAction } from '../utils/debug.js

// Log component props and state
export const logComponent = (componentName, props = {}, state = null) => {
  if (process.env.NODE_ENV === 'development') {
    console.group(`🔍 ${componentName} Debug`);
    console.log('Props:', props);
    if (state) {
      console.log('State:', state);
    }
    console.log('Timestamp:', new Date().toISOString());
    console.groupEnd();
  }
};

// Log form data before submission
export const logFormData = (formName, data) => {
  console.log(`📝 ${formName} Form Data:`, {
    data,
    timestamp: new Date().toISOString()
  });
};

// Log API response data
export const logApiResponse = (endpoint, response, error = null) => {
  if (error) {
    console.error(`❌ API Error (${endpoint}):`, {
      error,
      timestamp: new Date().toISOString()
    });
  } else {
    console.log(`✅ API Success (${endpoint}):`, {
      response,
      timestamp: new Date().toISOString()
    });
  }
};

// Log user interactions
export const logUserAction = (action, details = {}) => {
  console.log(`👤 User Action: ${action}`, {
    ...details,
    timestamp: new Date().toISOString(),
    url: window.location.href
  });
};

// Log performance metrics
export const logPerformance = (operation, startTime) => {
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  console.log(`⚡ Performance: ${operation}`, {
    duration: `${duration.toFixed(2)}ms`,
    timestamp: new Date().toISOString()
  });
};

// Log localStorage operations
export const logStorage = (operation, key, value = null) => {
  console.log(`💾 Storage ${operation}:`, {
    key,
    value: value ? (typeof value === 'string' ? value : JSON.stringify(value)) : null,
    timestamp: new Date().toISOString()
  });
};

// Debug table for complex data
export const logTable = (title, data) => {
  console.group(`📊 ${title}`);
  console.table(data);
  console.log('Timestamp:', new Date().toISOString());
  console.groupEnd();
};

// Log environment info
export const logEnvironment = () => {
  console.log('🌍 Environment Info:', {
    nodeEnv: process.env.NODE_ENV,
    apiUrl: import.meta.env.VITE_API_URL,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  });
};

// Performance measurement helper
export const measurePerformance = (name, fn) => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  console.log(`⚡ Performance: ${name}`, {
    duration: `${(end - start).toFixed(2)}ms`,
    timestamp: new Date().toISOString()
  });
  
  return result;
};

// Async performance measurement
export const measureAsyncPerformance = async (name, fn) => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  
  console.log(`⚡ Async Performance: ${name}`, {
    duration: `${(end - start).toFixed(2)}ms`,
    timestamp: new Date().toISOString()
  });
  
  return result;
};

// Log when debug module is loaded
console.log('🐛 Debug utilities loaded'); 