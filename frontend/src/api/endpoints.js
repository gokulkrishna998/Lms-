import apiClient from "./client";

// Auth
export const authApi = {
  register: (data) => apiClient.post("/auth/register", data),
  login: (data) => apiClient.post("/auth/login", data),
  logout: () => apiClient.post("/auth/logout"),
  getMe: () => apiClient.get("/auth/me"),
  forgotPassword: (data) => apiClient.post("/auth/forgot-password", data),
  resetPassword: (data) => apiClient.post("/auth/reset-password", data),
  updateProfile: (data) => apiClient.put("/auth/profile", data),
};

// Public Courses
export const coursesApi = {
  getAll: (params) => apiClient.get("/courses", { params }),
  getFeatured: () => apiClient.get("/courses/featured"),
  getBySlug: (slug) => apiClient.get(`/courses/${slug}`),
  getCategories: () => apiClient.get("/courses/categories"),
};

// Learning & Video Player
export const learningApi = {
  getCurriculum: (slug) => apiClient.get(`/learning/courses/${slug}/curriculum`),
  getLesson: (id) => apiClient.get(`/learning/lessons/${id}`),
  saveProgress: (id, data) => apiClient.post(`/learning/lessons/${id}/progress`, data),
};

// Payments & Orders
export const paymentsApi = {
  createOrder: (courseId) => apiClient.post("/payments/create-order", { course_id: courseId }),
  verifyPayment: (data) => apiClient.post("/payments/verify", data),
  getMyOrders: () => apiClient.get("/payments/my-orders"),
};

// Student
export const studentApi = {
  getDashboard: () => apiClient.get("/student/dashboard"),
  getMyCourses: () => apiClient.get("/student/courses"),
};

// Admin
export const adminApi = {
  getDashboard: () => apiClient.get("/admin/dashboard"),
  getCourses: () => apiClient.get("/admin/courses"),
  getCourse: (id) => apiClient.get(`/admin/courses/${id}`),
  createCourse: (data) => apiClient.post("/admin/courses", data),
  updateCourse: (id, data) => apiClient.put(`/admin/courses/${id}`, data),
  deleteCourse: (id) => apiClient.delete(`/admin/courses/${id}`),

  createModule: (courseId, data) => apiClient.post(`/admin/courses/${courseId}/modules`, data),
  updateModule: (id, data) => apiClient.put(`/admin/modules/${id}`, data),
  deleteModule: (id) => apiClient.delete(`/admin/modules/${id}`),

  createLesson: (moduleId, data) => apiClient.post(`/admin/modules/${moduleId}/lessons`, data),
  updateLesson: (id, data) => apiClient.put(`/admin/lessons/${id}`, data),
  deleteLesson: (id) => apiClient.delete(`/admin/lessons/${id}`),
  reorderCurriculum: (data) => apiClient.post("/admin/reorder", data),

  getStudents: (params) => apiClient.get("/admin/students", { params }),
  getStudentDetails: (id) => apiClient.get(`/admin/students/${id}`),
  toggleStudentStatus: (id, isActive) => apiClient.put(`/admin/students/${id}/status`, { is_active: isActive }),
  revokeEnrollment: (id, reason) => apiClient.post(`/admin/enrollments/${id}/revoke`, { reason }),

  getOrders: (params) => apiClient.get("/admin/orders", { params }),
  getSettings: () => apiClient.get("/admin/settings"),
  updateSettings: (data) => apiClient.post("/admin/settings", data),
  getAuditLogs: () => apiClient.get("/admin/audit-logs"),

  uploadThumbnail: (formData) =>
    apiClient.post("/uploads/thumbnail", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  uploadVideo: (formData) =>
    apiClient.post("/uploads/video", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  uploadResource: (formData) =>
    apiClient.post("/uploads/resource", formData, { headers: { "Content-Type": "multipart/form-data" } }),
};
