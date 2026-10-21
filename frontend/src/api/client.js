import axios from "axios";

const API_BASE_URL = "/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let sessionTerminatedHandler = null;

export const setSessionTerminatedHandler = (handler) => {
  sessionTerminatedHandler = handler;
};

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("minilms_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle session invalidation
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const errorData = error.response?.data;

    if (status === 401) {
      if (errorData?.error === "SESSION_TERMINATED") {
        localStorage.removeItem("minilms_token");
        localStorage.removeItem("minilms_user");
        if (sessionTerminatedHandler) {
          sessionTerminatedHandler(
            errorData.message ||
              "Your session has been terminated because your account was logged in from another device."
          );
        }
      } else if (errorData?.error === "TOKEN_EXPIRED") {
        localStorage.removeItem("minilms_token");
        localStorage.removeItem("minilms_user");
        if (sessionTerminatedHandler) {
          sessionTerminatedHandler("Your session has expired. Please log in again.");
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
