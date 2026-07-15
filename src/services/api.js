const API_BASE = 'https://eduspace-backend-bh29.onrender.com';
const TOKEN_KEY = 'jwt_token';

function handleUnauthorized() {
  localStorage.clear();
  window.location.href = '/login';
}

// Core fetch wrapper
async function apiCall(endpoint, method = 'GET', body = null, isAuthEndpoint = false) {
  const headers = { 'Content-Type': 'application/json' };

  const token =
    localStorage.getItem(TOKEN_KEY) ||
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('access_token');

  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 && !isAuthEndpoint) {
        handleUnauthorized();
        return;
      }
      const err = new Error(data.error || data.message || data.msg || `Error: ${response.status}`);
      err.status = response.status;
      if (data.cooldown_seconds !== undefined) err.cooldown_seconds = data.cooldown_seconds;
      throw err;
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// ✅ Axios-style api object — used by FacultyDashboard & AdminDashboard
// Wraps responses as { data: ... } to match Axios format
export const api = {
  get: async (endpoint) => {
    const data = await apiCall(endpoint, 'GET');
    return { data };
  },
  post: async (endpoint, body) => {
    const data = await apiCall(endpoint, 'POST', body);
    return { data };
  },
  put: async (endpoint, body) => {
    const data = await apiCall(endpoint, 'PUT', body);
    return { data };
  },
  delete: async (endpoint) => {
    const data = await apiCall(endpoint, 'DELETE');
    return { data };
  },
};

// Named API modules — used by StudentDashboard & AuthPages
export const authAPI = {
  login: (email, password) =>
    apiCall('/api/auth/login', 'POST', { email, password }, true),

  register: (email, password, firstName, lastName, role, securityQuestion, securityAnswer) =>
    apiCall('/api/auth/register', 'POST', {
      email, password, first_name: firstName, last_name: lastName, role,
      security_question: securityQuestion, security_answer: securityAnswer
    }, true),

  getSecurityQuestions: () => apiCall('/api/auth/security-questions', 'GET', null, true),
  forgotPasswordGetQuestion: (email) =>
    apiCall('/api/auth/forgot-password/question', 'POST', { email }, true),
  forgotPasswordVerifyAnswer: (email, security_answer) =>
    apiCall('/api/auth/forgot-password/verify', 'POST', { email, security_answer }, true),
  forgotPasswordReset: (reset_token, new_password) =>
    apiCall('/api/auth/forgot-password/reset', 'POST', { reset_token, new_password }, true),

  getCurrentUser: () => apiCall('/api/auth/profile', 'GET'),
  updateProfile: (data) => apiCall('/api/auth/profile', 'PUT', data),
  changePassword: (old_password, new_password) =>
    apiCall('/api/auth/change-password', 'POST', { old_password, new_password }),

  verifyOtp: (pre_auth_token, code) =>
    apiCall('/api/auth/verify-otp', 'POST', { pre_auth_token, code }, true),
  resendOtp: (pre_auth_token) =>
    apiCall('/api/auth/resend-otp', 'POST', { pre_auth_token }, true),
  toggle2FA: (password, enable) =>
    apiCall('/api/auth/2fa/toggle', 'POST', { password, enable }),
};

export const roomsAPI = {
  getAllRooms: () => apiCall('/api/rooms', 'GET'),
  getRoom: (id) => apiCall(`/api/rooms/${id}`, 'GET'),
  checkIn: (id) => apiCall(`/api/rooms/${id}/checkin`, 'POST'),
  checkOut: (id) => apiCall(`/api/rooms/${id}/checkout`, 'POST'),
  verifyQRCheckin: (qrTokenString) => apiCall('/api/rooms/verify-qr-checkin', 'POST', { qr_token: qrTokenString }),
};

export const timeSlotsAPI = {
  getAllSlots: () => apiCall('/api/time-slots', 'GET'),
};

export const bookingAPI = {
  createRequest: (data) => apiCall('/api/booking-requests', 'POST', data),
  getMyRequests: () => apiCall('/api/my-booking-requests', 'GET'),
  getMyBookings: () => apiCall('/api/my-bookings', 'GET'),
};

export const adminAPI = {
  getPendingRequests: () => apiCall('/api/admin/pending-requests', 'GET'),
  approveRequest: (id, notes = '') =>
    apiCall(`/api/admin/booking-request/${id}/approve`, 'POST', { notes }),
  rejectRequest: (id, reason = '') =>
    apiCall(`/api/admin/booking-request/${id}/reject`, 'POST', { reason }),
  getAllBookings: () => apiCall('/api/admin/all-bookings', 'GET'),
};

export const attendanceAPI = {
  getAttendance: (bookingId) => apiCall(`/api/booking/${bookingId}/attendance`, 'GET'),
  markAttendance: (bookingId, studentId, status) =>
    apiCall(`/api/booking/${bookingId}/mark-attendance`, 'POST', { student_id: studentId, status }),
  getSummary: (bookingId) => apiCall(`/api/booking/${bookingId}/attendance-summary`, 'GET'),
};

export const feedbackAPI = {
  submitFeedback: (bookingId, rating, comment, aspects = '') =>
    apiCall(`/api/booking/${bookingId}/feedback`, 'POST', { rating, comment, aspects }),
};

export default { api, authAPI, roomsAPI, timeSlotsAPI, bookingAPI, adminAPI, attendanceAPI, feedbackAPI };