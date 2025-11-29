// API Configuration
export const API_BASE_URL = 'http://localhost:5000/api';

// API Endpoints
export const API_ENDPOINTS = {
  // Firms
  FIRMS: `${API_BASE_URL}/firms`,
  
  // Bills
  BILLS: `${API_BASE_URL}/bills`,
  
  // Upload
  UPLOAD_MULTIPLE: `${API_BASE_URL}/upload/upload-multiple`,
  EXTRACT_GST: `${API_BASE_URL}/bills/extract-gst`,
  
  // Auth
  AUTH_LOGIN: `${API_BASE_URL}/auth/login`,
  AUTH_REGISTER: `${API_BASE_URL}/auth/register`,
  
  // Users
  USERS: `${API_BASE_URL}/users`,
};

// Helper function to get bill by ID
export const getBillEndpoint = (billId: string) => `${API_ENDPOINTS.BILLS}/${billId}`;

// Helper function to get user by ID
export const getUserEndpoint = (userId: string) => `${API_ENDPOINTS.USERS}/${userId}`;
