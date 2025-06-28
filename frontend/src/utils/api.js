// API utility functions with comprehensive logging
const API_URL = import.meta.env.VITE_API_URL;

// Log API configuration
console.log('🔧 API Configuration:', {
  API_URL,
  timestamp: new Date().toISOString()
});

// Helper function to get auth headers
const getAuthHeaders = (token) => {
  if (!token) {
    console.warn('⚠️ No token provided for API request');
    return { 'Content-Type': 'application/json' };
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// Generic API request function with logging
export const apiRequest = async (endpoint, options = {}, token = null) => {
  const url = `${API_URL}${endpoint}`;
  const headers = getAuthHeaders(token);
  
  const requestConfig = {
    ...options,
    headers: {
      ...headers,
      ...options.headers
    }
  };

  console.log('📡 API Request:', {
    method: requestConfig.method || 'GET',
    url,
    hasToken: !!token,
    timestamp: new Date().toISOString()
  });

  if (requestConfig.body) {
    console.log('📦 Request body:', requestConfig.body);
  }

  try {
    const response = await fetch(url, requestConfig);
    
    console.log('📊 API Response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      url: response.url
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ API Error:', {
        status: response.status,
        error: data.error,
        message: data.message,
        details: data
      });
      throw new Error(data.error || data.message || 'API request failed');
    }

    console.log('✅ API Success:', {
      dataType: typeof data,
      isArray: Array.isArray(data),
      length: Array.isArray(data) ? data.length : null
    });

    return data;
  } catch (error) {
    console.error('💥 API Request Error:', {
      message: error.message,
      stack: error.stack,
      url
    });
    throw error;
  }
};

// Specific API functions
export const api = {
  // Patient APIs
  getPatients: (token) => apiRequest('/api/patients', {}, token),
  getPatient: (hn, token) => apiRequest(`/api/patients/${hn}`, {}, token),
  createPatient: (patientData, token) => apiRequest('/api/patients', {
    method: 'POST',
    body: JSON.stringify(patientData)
  }, token),
  updatePatient: (hn, patientData, token) => apiRequest(`/api/patients/${hn}`, {
    method: 'PUT',
    body: JSON.stringify(patientData)
  }, token),
  deletePatient: (hn, token) => apiRequest(`/api/patients/${hn}`, {
    method: 'DELETE'
  }, token),

  // Appointment APIs
  getAppointments: (token) => apiRequest('/api/appointments', {}, token),
  getAppointment: (id, token) => apiRequest(`/api/appointments/${id}`, {}, token),
  createAppointment: (appointmentData, token) => apiRequest('/api/appointments', {
    method: 'POST',
    body: JSON.stringify(appointmentData)
  }, token),
  updateAppointment: (id, appointmentData, token) => apiRequest(`/api/appointments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(appointmentData)
  }, token),
  deleteAppointment: (id, token) => apiRequest(`/api/appointments/${id}`, {
    method: 'DELETE'
  }, token),

  // User APIs
  register: (userData, token) => apiRequest('/api/users/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  }, token),
  login: (credentials) => apiRequest('/api/users/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  }),
  getProfile: (token) => apiRequest('/api/users/profile', {}, token),
  updateProfile: (profileData, token) => apiRequest('/api/users/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData)
  }, token),

  // Health check
  healthCheck: () => apiRequest('/api/health', {})
};

// Log when API module is loaded
console.log('📚 API utility module loaded'); 