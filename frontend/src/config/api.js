import axios from 'axios';

// Directly targeting port 8000 where core-service is running
const API_BASE_URL = 'http://localhost:8000/api/v1';

// Register global request interceptor to attach bearer token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Variable to track token refreshing state
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Helper to attempt a token refresh and retry the original request
const attemptTokenRefresh = async (originalRequest, error) => {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    })
      .then((token) => {
        originalRequest.headers['Authorization'] = `Bearer ${token}`;
        return axios(originalRequest);
      })
      .catch((err) => Promise.reject(err));
  }

  originalRequest._retry = true;
  isRefreshing = true;

  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) {
    isRefreshing = false;
    processQueue(new Error('No refresh token available'));
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_email');
    window.location.href = '/login';
    return Promise.reject(error);
  }

  try {
    const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
      refreshToken: refreshToken
    });

    const { accessToken, refreshToken: newRefreshToken } = response.data;

    localStorage.setItem('auth_token', accessToken);
    localStorage.setItem('refresh_token', newRefreshToken);

    axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;

    processQueue(null, accessToken);
    isRefreshing = false;

    return axios(originalRequest);
  } catch (refreshError) {
    processQueue(refreshError, null);
    isRefreshing = false;

    // Clean up and force redirect to login
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_email');
    window.location.href = '/login';
    return Promise.reject(refreshError);
  }
};

// Response interceptor for automatic token refresh on 401 Unauthorized and 403 Forbidden (JWT expiry)
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const isAuthEndpoint = originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/refresh-token');

    // Handle both 401 (unauthorized) and 403 (forbidden / JWT validation error) by refreshing the token
    if ((status === 401 || status === 403) && !originalRequest._retry && !isAuthEndpoint) {
      return attemptTokenRefresh(originalRequest, error);
    }

    return Promise.reject(error);
  }
);

export const API_ENDPOINTS = {
  API_BASE_URL,
  AUTH_LOGIN: `${API_BASE_URL}/auth/login`,
  AUTH_REFRESH: `${API_BASE_URL}/auth/refresh-token`,
  
  // Customers Subscriptions
  CUSTOMERS: `${API_BASE_URL}/customers`,
  CUSTOMERS_DETAIL: (id) => `${API_BASE_URL}/customers/${id}`,
  CUSTOMERS_COMMUNICATIONS: (id) => `${API_BASE_URL}/customers/${id}/communications`,


  // Channels Delivery Templates
  TEMPLATES_DOCUMENTS: `${API_BASE_URL}/templates/documents`,
  TEMPLATES_EMAIL: `${API_BASE_URL}/templates/email`,
  TEMPLATES_SMS: `${API_BASE_URL}/templates/sms`,
  TEMPLATES_WHATSAPP: `${API_BASE_URL}/templates/whatsapp`,
  TEMPLATES_POSTAL: `${API_BASE_URL}/templates/postal`,

  // Communication definitions routing
  COMMUNICATION_DEFINITIONS: `${API_BASE_URL}/communication-definitions`,

  // Folders & Ingested files manager
  FILES: `${API_BASE_URL}/files`,
  FILES_FOLDERS: `${API_BASE_URL}/files/folders`,
  FILES_UPLOAD: (folderId) => `${API_BASE_URL}/files/upload?folderId=${folderId}`,
  FILES_UPLOAD_INIT: `${API_BASE_URL}/files/upload/init`,
  FILES_UPLOAD_CHUNK: (uploadId) => `${API_BASE_URL}/files/upload/${uploadId}/chunk`,
  FILES_UPLOAD_COMPLETE: (uploadId) => `${API_BASE_URL}/files/upload/${uploadId}/complete`,

  // Batches
  BATCHES: 'http://localhost:8000/api/batch/import',
  BATCHES_UPLOAD: `${API_BASE_URL}/batches/upload`,
  BATCHES_TRIGGER: `http://localhost:8000/api/batch/import`,

  // Monitoring DLQ & metrics
  METRICS: `${API_BASE_URL}/reports/metrics`,
  TRACKINGS: `${API_BASE_URL}/reports/trackings`,
  DLQ: `${API_BASE_URL}/dlq`,
  DLQ_COUNTS: `${API_BASE_URL}/dlq/counts`,
  DLQ_RETRY: (id) => `${API_BASE_URL}/dlq/${id}/retry`,
  DLQ_IGNORE: (id) => `${API_BASE_URL}/dlq/${id}/ignore`,
  DLQ_PDF: (id) => `${API_BASE_URL}/communications/${id}/pdf`,
  COMMUNICATION_ATTEMPTS: (id) => `${API_BASE_URL}/communications/${id}/attempts`,
  COMMUNICATION_UPDATE: (id) => `${API_BASE_URL}/communications/${id}`
};

export default API_ENDPOINTS;

