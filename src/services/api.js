const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper to get role from path
const getRoleFromPath = (path) => {
  if (path?.startsWith('/super-admin')) return 'super_admin';
  if (path?.startsWith('/admin')) return 'admin';
  if (path?.startsWith('/client')) return 'client';
  if (path?.startsWith('/user')) return 'user';
  return null;
};

// Helper to get token for a specific role
// IMPORTANT: Never fallback to other roles - each role must use its own token
const getTokenForRole = (role) => {
  if (!role) {
    // Try to get role from current path
    const currentPath = window.location.pathname;
    role = getRoleFromPath(currentPath);
  }

  if (role) {
    const token = localStorage.getItem(`token_${role}`);
    // Verify token role matches (decode and check)
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role === role) {
          return token;
        } else {
          console.warn(`[Token Mismatch] Token role (${payload.role}) doesn't match requested role (${role})`);
          return null; // Don't return mismatched token
        }
      } catch (e) {
        // If can't decode, return as-is (might be invalid token)
        return token;
      }
    }
    return null;
  }

  // NO FALLBACK - return null if role not specified
  // This prevents using wrong tokens
  return null;
};

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    // Get token from options or determine from endpoint/context
    let token = options.token;
    let tokenSource = 'provided';

    if (!token) {
      // Determine role from endpoint
      if (endpoint.includes('/super-admin/') || endpoint.includes('/auth/super-admin/')) {
        token = getTokenForRole('super_admin');
        tokenSource = 'super_admin (endpoint match)';
      } else if (endpoint.includes('/admin/') || endpoint.includes('/auth/admin/')) {
        token = getTokenForRole('admin');
        tokenSource = 'admin (endpoint match)';
      } else if (endpoint.includes('/client/') || endpoint.includes('/auth/client/') ||
        endpoint.includes('/testimonials') || endpoint.includes('/founder-messages') || endpoint.includes('/brand-assets') ||
        endpoint.includes('/meditations')) {
        // TESTIMONIALS, FOUNDER MESSAGES, BRAND ASSETS & MEDITATIONS: Always use client token
        token = getTokenForRole('client');
        tokenSource = endpoint.includes('/testimonials') ? 'client (testimonials endpoint)' : 
                     endpoint.includes('/founder-messages') ? 'client (founder-messages endpoint)' : 
                     endpoint.includes('/brand-assets') ? 'client (brand-assets endpoint)' :
                     endpoint.includes('/meditations') ? 'client (meditations endpoint)' :
                     'client (endpoint match)';
      } else if (endpoint.includes('/user/') || endpoint.includes('/auth/user/') || endpoint.includes('/users/') ||
        endpoint.includes('/mobile/chat') || endpoint.includes('/mobile/voice') || endpoint.includes('/mobile/user/')) {
        // CRITICAL: Mobile endpoints (chat, voice, user profile) MUST use user token ONLY
        // These endpoints are ONLY for 'user' role - NEVER use other tokens
        token = getTokenForRole('user');
        tokenSource = 'user (mobile endpoint - user role required)';

        // Verify token is actually a user token
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.role !== 'user') {
              console.error('[API Error] Wrong token role for mobile endpoint:', {
                endpoint,
                tokenRole: payload.role,
                requiredRole: 'user',
                message: 'Rejecting non-user token for mobile endpoint'
              });
              token = null; // Reject wrong token
              tokenSource = 'rejected (wrong role)';
            }
          } catch (e) {
            console.warn('[API Warning] Could not verify token role:', e);
          }
        }

        // Warn if no user token found but other tokens exist
        if (!token) {
          const otherTokens = {
            super_admin: !!localStorage.getItem('token_super_admin'),
            admin: !!localStorage.getItem('token_admin'),
            client: !!localStorage.getItem('token_client')
          };
          const hasOtherTokens = Object.values(otherTokens).some(v => v);
          if (hasOtherTokens) {
            console.error('[API Error]', {
              endpoint,
              message: 'Mobile endpoint requires user token, but user is not logged in. Other roles are logged in. Please logout and login as a user.',
              otherTokens,
              availableTokens: Object.keys(otherTokens).filter(k => otherTokens[k])
            });
          }
        }
      } else {
        // For other endpoints, try to get token from current route
        const currentPath = window.location.pathname;
        const routeRole = getRoleFromPath(currentPath);
        if (routeRole) {
          token = getTokenForRole(routeRole);
          tokenSource = `route-based (${routeRole})`;
        } else {
          // No role detected, no token
          token = null;
          tokenSource = 'none (no role detected)';
        }
      }
    }

    // Debug logging
    // console.log('[API Request]', {
    //   endpoint,
    //   hasToken: !!token,
    //   tokenSource
    // });
   


    // Merge headers without dropping Authorization when options.headers is provided
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(options.headers || {}),
      },
    };

    // Remove token from options to avoid sending it in body
    delete config.token;

    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      const data = await response.json();

      // Debug logging for errors
      if (!response.ok) {
        // Check for role mismatch errors
        if (response.status === 403 && data.error === 'INVALID_ROLE') {
          console.error('[API Error - Role Mismatch]', {
            endpoint,
            status: response.status,
            requiredRole: data.requiredRole,
            currentRole: data.currentRole,
            message: data.message,
            hasToken: !!token,
            tokenSource
          });

          // Show user-friendly error for role mismatch
          if (data.currentRole && data.requiredRole) {
            const errorMsg = `You are logged in as '${data.currentRole}' but this feature requires '${data.requiredRole}' role. Please logout and login as a user.`;
            console.error('[Role Mismatch]', errorMsg);
            // You can trigger a notification/toast here if needed
          }
        } else {
          // Include detailed error message if available (for development)
          const errorMessage = data.error && data.message 
            ? `${data.message} (${data.error})` 
            : data.error || data.message || 'Request failed';
          
          console.error('[API Error]', {
            endpoint,
            status: response.status,
            statusText: response.statusText,
            error: errorMessage,
            hasToken: !!token,
            responseData: data
          });
          
          const error = new Error(errorMessage);
          error.status = response.status;
          error.responseData = data;
          throw error;
        }
      }

      return data;
    } catch (error) {
      console.error('[API Exception]', {
        endpoint,
        error: error.message,
        hasToken: !!token
      });
      throw error;
    }
  }

  // Super Admin Auth endpoints
  async superAdminLogin(email, password) {
    return this.request('/auth/super-admin/login', {
      method: 'POST',
      body: { email, password },
    });
  }

  // Admin Auth endpoints
  async adminLogin(email, password) {
    return this.request('/auth/admin/login', {
      method: 'POST',
      body: { email, password },
    });
  }

  async getCurrentAdmin(token = null) {
    return this.request('/auth/admin/me', { token });
  }

  // Client Auth endpoints
  async clientLogin(email, password) {
    return this.request('/auth/client/login', {
      method: 'POST',
      body: { email, password },
    });
  }

  async clientRegister(email, password, businessName, businessType, contactNumber, address) {
    return this.request('/auth/client/register', {
      method: 'POST',
      body: { email, password, businessName, businessType, contactNumber, address },
    });
  }

  async getCurrentClient(token = null) {
    return this.request('/auth/client/me', { token });
  }

  // User Auth endpoints
  async userLogin(email, password) {
    return this.request('/auth/user/login', {
      method: 'POST',
      body: { email, password },
    });
  }

  async userRegister(email, password, profile) {
    return this.request('/auth/user/register', {
      method: 'POST',
      body: { email, password, profile },
    });
  }

  async getCurrentUser(token = null) {
    return this.request('/auth/user/me', { token });
  }

  // Mobile User Registration (Multi-step with OTP)
  async mobileUserRegisterStep1(email, password) {
    return this.request('/mobile/user/register/step1', {
      method: 'POST',
      body: { email, password },
    });
  }

  async mobileUserRegisterStep1Verify(email, otp) {
    return this.request('/mobile/user/register/step1/verify', {
      method: 'POST',
      body: { email, otp },
    });
  }

  async mobileUserRegisterStep2(email, mobile) {
    return this.request('/mobile/user/register/step2', {
      method: 'POST',
      body: { email, mobile },
    });
  }

  async mobileUserRegisterStep2Verify(email, otp) {
    return this.request('/mobile/user/register/step2/verify', {
      method: 'POST',
      body: { email, otp },
    });
  }

  async mobileUserRegisterStep3(email, profileData, imageFileName, imageContentType) {
    return this.request('/mobile/user/register/step3', {
      method: 'POST',
      body: {
        email,
        ...profileData,
        imageFileName,
        imageContentType
      },
    });
  }

  async resendEmailOTP(email) {
    return this.request('/mobile/user/register/resend-email-otp', {
      method: 'POST',
      body: { email },
    });
  }

  async resendMobileOTP(email) {
    return this.request('/mobile/user/register/resend-mobile-otp', {
      method: 'POST',
      body: { email },
    });
  }

  // Mobile User Login (after registration is complete)
  async mobileUserLogin(email, password) {
    return this.request('/auth/user/login', {
      method: 'POST',
      body: { email, password },
    });
  }

  // Firebase Authentication endpoints
  async firebaseSignUp(idToken) {
    return this.request('/mobile/user/register/firebase', {
      method: 'POST',
      body: { idToken },
    });
  }

  async firebaseSignIn(idToken) {
    return this.request('/mobile/user/login/firebase', {
      method: 'POST',
      body: { idToken },
    });
  }

  // Chat APIs
  async createChat(token, title = null) {
    return this.request('/mobile/chat', {
      method: 'POST',
      token,
      body: title ? { title } : {},
    });
  }

  async getChats(token) {
    return this.request('/mobile/chat', {
      method: 'GET',
      token,
    });
  }

  async getChat(chatId, token) {
    return this.request(`/mobile/chat/${chatId}`, {
      method: 'GET',
      token,
    });
  }

  async sendChatMessage(chatId, message, token) {
    return this.request(`/mobile/chat/${chatId}/message`, {
      method: 'POST',
      token,
      body: { message },
    });
  }

  async deleteChat(chatId, token) {
    return this.request(`/mobile/chat/${chatId}`, {
      method: 'DELETE',
      token,
    });
  }

  // Voice APIs
  async startVoiceSession(token, existingChatId = null) {
    return this.request('/mobile/voice/start', {
      method: 'POST',
      token,
      body: existingChatId ? { chatId: existingChatId } : {},
    });
  }

  async processVoice(chatId, audioData, token, audioFormat = 'linear16') {
    return this.request('/mobile/voice/process', {
      method: 'POST',
      token,
      body: {
        chatId,
        audioData,
        audioFormat,
      },
    });
  }

  // Super Admin endpoints
  async getAdmins() {
    return this.request('/super-admin/admins');
  }

  async createAdmin(email, password) {
    return this.request('/super-admin/admins', {
      method: 'POST',
      body: { email, password },
    });
  }

  async updateAdmin(id, data) {
    return this.request(`/super-admin/admins/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteAdmin(id) {
    return this.request(`/super-admin/admins/${id}`, {
      method: 'DELETE',
    });
  }

  async getSuperAdminDashboard() {
    return this.request('/super-admin/dashboard/overview');
  }

  async getPendingApprovals() {
    return this.request('/super-admin/pending-approvals');
  }

  async getUsers() {
    return this.request('/super-admin/users');
  }

  async deleteUser(userId) {
    return this.request(`/super-admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async approveLogin(type, userId) {
    return this.request(`/super-admin/approve-login/${type}/${userId}`, {
      method: 'POST',
    });
  }

  async rejectLogin(type, userId) {
    return this.request(`/super-admin/reject-login/${type}/${userId}`, {
      method: 'POST',
    });
  }

  // Admin endpoints
  async getClients() {
    return this.request('/admin/clients');
  }

  async createClient(clientData) {
    return this.request('/admin/clients', {
      method: 'POST',
      body: clientData,
    });
  }

  async getClientLoginToken(clientId) {
    return this.request(`/admin/clients/${clientId}/login-token`, {
      method: 'POST',
    });
  }

  async updateClient(id, data) {
    return this.request(`/admin/clients/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteClient(id) {
    return this.request(`/admin/clients/${id}`, {
      method: 'DELETE',
    });
  }

  async getAdminUsers() {
    return this.request('/admin/users');
  }

  async getAdminDashboard() {
    return this.request('/admin/dashboard/overview');
  }

  // Client endpoints
  async getClientUsers() {
    return this.request('/client/users');
  }

  async createClientUser(email, password, profile) {
    return this.request('/client/users', {
      method: 'POST',
      body: { email, password, profile },
    });
  }

  async updateClientUser(id, data) {
    return this.request(`/client/users/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteClientUser(id) {
    return this.request(`/client/users/${id}`, {
      method: 'DELETE',
    });
  }

  async getClientDashboard() {
    return this.request('/client/dashboard/overview');
  }

  // User endpoints
  async getUserProfile() {
    return this.request('/users/profile');
  }

  async updateUserProfile(data) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: data,
    });
  }

  // Upload endpoints
  async getPresignedUrl(fileName, contentType) {
    return this.request('/upload/presigned-url', {
      method: 'POST',
      body: { fileName, contentType },
    });
  }

  async uploadToS3(presignedUrl, file) {
    return fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });
  }

  // Real-time Agent APIs
  async createRealtimeAgentRoom(token) {
    return this.request('/mobile/realtime-agent/create-room', {
      method: 'POST',
      token,
    });
  }

  // Password Reset APIs
  async forgotPassword(email) {
    return this.request('/auth/user/forgot-password', {
      method: 'POST',
      body: { email },
    });
  }

  async verifyResetOTP(email, otp) {
    return this.request('/auth/user/verify-reset-otp', {
      method: 'POST',
      body: { email, otp },
    });
  }

  async resetPassword(email, resetToken, newPassword) {
    return this.request('/auth/user/reset-password', {
      method: 'POST',
      body: { email, resetToken, newPassword },
    });
  }

  async resendResetOTP(email) {
    return this.request('/auth/user/resend-reset-otp', {
      method: 'POST',
      body: { email },
    });
  }

  // Testimonial APIs - Client Bearer Token Required
  async getTestimonials() {
    return this.request('/testimonials');
  }

  async getTestimonial(id) {
    return this.request(`/testimonials/${id}`);
  }

  async createTestimonial(testimonialData) {
    return this.request('/testimonials', {
      method: 'POST',
      body: testimonialData,
    });
  }

  async updateTestimonial(id, testimonialData) {
    return this.request(`/testimonials/${id}`, {
      method: 'PUT',
      body: testimonialData,
    });
  }

  async deleteTestimonial(id) {
    return this.request(`/testimonials/${id}`, {
      method: 'DELETE',
    });
  }

  async uploadTestimonialImage(id, imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);

    // Get client token for testimonial image upload
    const token = getTokenForRole('client');

    return fetch(`${this.baseURL}/testimonials/${id}/upload-image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        // Don't set Content-Type for FormData - browser sets it with boundary
      },
      body: formData,
    }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Image upload failed');
      }
      return data;
    });
  }

  async getTestimonialStats() {
    return this.request('/testimonials/stats/summary');
  }

  // Mobile User Registration with Image
  async registerUserWithImage(formData) {
    // formData should be FormData object with fields: email, password, name, dob, timeOfBirth, placeOfBirth, gowthra, profession, image (file)
    return fetch(`${this.baseURL}/mobile/user/register-with-image`, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - browser will set it with boundary for multipart/form-data
    }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      return data;
    });
  }

  // Update User Profile with Image
  async updateUserProfileWithImage(formData, token) {
    // formData should be FormData object with optional fields: email, password, profile (JSON string), image (file)
    return fetch(`${this.baseURL}/mobile/user/profile`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        // Don't set Content-Type header - browser will set it with boundary for multipart/form-data
      },
      body: formData,
    }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Profile update failed');
      }
      return data;
    });
  }

  // Mobile User Registration - Step 4: Upload Profile Image
  async mobileUserRegisterStep4UploadImage(formData, token) {
    // formData should have field: image (file)
    return fetch(`${this.baseURL}/mobile/user/profile/image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        // No Content-Type; browser sets it for multipart/form-data
      },
      body: formData,
    }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Profile image upload failed');
      }
      return data;
    });
  }
}


const apiService = new ApiService();

// Create axios-like interface
const api = {
  get: async (url, config = {}) => {
    const response = await apiService.request(url, { method: 'GET', ...config });
    return { data: response };
  },
  post: async (url, data, config = {}) => {
    const response = await apiService.request(url, { method: 'POST', body: data, ...config });
    return { data: response };
  },
  put: async (url, data, config = {}) => {
    const response = await apiService.request(url, { method: 'PUT', body: data, ...config });
    return { data: response };
  },
  delete: async (url, config = {}) => {
    const response = await apiService.request(url, { method: 'DELETE', ...config });
    return { data: response };
  },
  patch: async (url, data, config = {}) => {
    const response = await apiService.request(url, { method: 'PATCH', body: data, ...config });
    return { data: response };
  },
  // Auth methods
  superAdminLogin: apiService.superAdminLogin.bind(apiService),
  adminLogin: apiService.adminLogin.bind(apiService),
  getCurrentAdmin: apiService.getCurrentAdmin.bind(apiService),
  clientLogin: apiService.clientLogin.bind(apiService),
  clientRegister: apiService.clientRegister.bind(apiService),
  getCurrentClient: apiService.getCurrentClient.bind(apiService),
  userLogin: apiService.userLogin.bind(apiService),
  userRegister: apiService.userRegister.bind(apiService),
  getCurrentUser: apiService.getCurrentUser.bind(apiService),
  // Mobile registration methods
  mobileUserRegisterStep1: apiService.mobileUserRegisterStep1.bind(apiService),
  mobileUserRegisterStep1Verify: apiService.mobileUserRegisterStep1Verify.bind(apiService),
  mobileUserRegisterStep2: apiService.mobileUserRegisterStep2.bind(apiService),
  mobileUserRegisterStep2Verify: apiService.mobileUserRegisterStep2Verify.bind(apiService),
  mobileUserRegisterStep3: apiService.mobileUserRegisterStep3.bind(apiService),
  resendEmailOTP: apiService.resendEmailOTP.bind(apiService),
  resendMobileOTP: apiService.resendMobileOTP.bind(apiService),
  mobileUserLogin: apiService.mobileUserLogin.bind(apiService),
  // Firebase methods
  firebaseSignUp: apiService.firebaseSignUp.bind(apiService),
  firebaseSignIn: apiService.firebaseSignIn.bind(apiService),
  // Chat methods
  createChat: apiService.createChat.bind(apiService),
  getChats: apiService.getChats.bind(apiService),
  getChat: apiService.getChat.bind(apiService),
  sendChatMessage: apiService.sendChatMessage.bind(apiService),
  deleteChat: apiService.deleteChat.bind(apiService),
  // Voice methods
  startVoiceSession: apiService.startVoiceSession.bind(apiService),
  processVoice: apiService.processVoice.bind(apiService),
  // Super Admin methods
  getAdmins: apiService.getAdmins.bind(apiService),
  createAdmin: apiService.createAdmin.bind(apiService),
  updateAdmin: apiService.updateAdmin.bind(apiService),
  deleteAdmin: apiService.deleteAdmin.bind(apiService),
  getSuperAdminDashboard: apiService.getSuperAdminDashboard.bind(apiService),
  getPendingApprovals: apiService.getPendingApprovals.bind(apiService),
  getUsers: apiService.getUsers.bind(apiService),
  deleteUser: apiService.deleteUser.bind(apiService),
  approveLogin: apiService.approveLogin.bind(apiService),
  rejectLogin: apiService.rejectLogin.bind(apiService),
  // Admin methods
  getClients: apiService.getClients.bind(apiService),
  createClient: apiService.createClient.bind(apiService),
  getClientLoginToken: apiService.getClientLoginToken.bind(apiService),
  updateClient: apiService.updateClient.bind(apiService),
  deleteClient: apiService.deleteClient.bind(apiService),
  getAdminUsers: apiService.getAdminUsers.bind(apiService),
  getAdminDashboard: apiService.getAdminDashboard.bind(apiService),
  // Client methods
  getClientUsers: apiService.getClientUsers.bind(apiService),
  createClientUser: apiService.createClientUser.bind(apiService),
  updateClientUser: apiService.updateClientUser.bind(apiService),
  deleteClientUser: apiService.deleteClientUser.bind(apiService),
  getClientDashboard: apiService.getClientDashboard.bind(apiService),
  // User methods
  getUserProfile: apiService.getUserProfile.bind(apiService),
  updateUserProfile: apiService.updateUserProfile.bind(apiService),
  // Upload methods
  getPresignedUrl: apiService.getPresignedUrl.bind(apiService),
  uploadToS3: apiService.uploadToS3.bind(apiService),
  // Realtime agent
  createRealtimeAgentRoom: apiService.createRealtimeAgentRoom.bind(apiService),
  // Password reset
  forgotPassword: apiService.forgotPassword.bind(apiService),
  verifyResetOTP: apiService.verifyResetOTP.bind(apiService),
  resetPassword: apiService.resetPassword.bind(apiService),
  resendResetOTP: apiService.resendResetOTP.bind(apiService),
  // Testimonials
  getTestimonials: apiService.getTestimonials.bind(apiService),
  getTestimonial: apiService.getTestimonial.bind(apiService),
  createTestimonial: apiService.createTestimonial.bind(apiService),
  updateTestimonial: apiService.updateTestimonial.bind(apiService),
  deleteTestimonial: apiService.deleteTestimonial.bind(apiService),
  uploadTestimonialImage: apiService.uploadTestimonialImage.bind(apiService),
  getTestimonialStats: apiService.getTestimonialStats.bind(apiService),
  // Mobile user registration with image
  registerUserWithImage: apiService.registerUserWithImage.bind(apiService),
  updateUserProfileWithImage: apiService.updateUserProfileWithImage.bind(apiService),
  mobileUserRegisterStep4UploadImage: apiService.mobileUserRegisterStep4UploadImage.bind(apiService),
  // Direct request method
  request: apiService.request.bind(apiService)
};

export default api;
