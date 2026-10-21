import React, { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "../api/endpoints";
import { setSessionTerminatedHandler } from "../api/client";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("minilms_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("minilms_token") || null);
  const [loading, setLoading] = useState(true);
  const [sessionTerminatedMsg, setSessionTerminatedMsg] = useState(null);

  // Hook into client.js to catch single-device session invalidations
  useEffect(() => {
    setSessionTerminatedHandler((msg) => {
      setUser(null);
      setToken(null);
      setSessionTerminatedMsg(msg);
    });
  }, []);

  // Validate active session with backend on load
  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = localStorage.getItem("minilms_token");
      if (!storedToken) {
        setLoading(false);
        return;
      }
      try {
        const res = await authApi.getMe();
        setUser(res.data.user);
        localStorage.setItem("minilms_user", JSON.stringify(res.data.user));
      } catch (err) {
        console.warn("Session check failed:", err.response?.data?.message || err.message);
        // Error interceptor will handle termination message if applicable
      } finally {
        setLoading(false);
      }
    };
    verifyAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    const { token: newToken, user: userData } = res.data;
    setToken(newToken);
    setUser(userData);
    localStorage.setItem("minilms_token", newToken);
    localStorage.setItem("minilms_user", JSON.stringify(userData));
    setSessionTerminatedMsg(null);
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await authApi.register({ name, email, password });
    const { token: newToken, user: userData } = res.data;
    setToken(newToken);
    setUser(userData);
    localStorage.setItem("minilms_token", newToken);
    localStorage.setItem("minilms_user", JSON.stringify(userData));
    setSessionTerminatedMsg(null);
    return res.data;
  };

  const logout = async () => {
    try {
      if (token) {
        await authApi.logout();
      }
    } catch (err) {
      console.warn("Logout error:", err);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem("minilms_token");
      localStorage.removeItem("minilms_user");
    }
  };

  const dismissSessionModal = () => {
    setSessionTerminatedMsg(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
        sessionTerminatedMsg,
        dismissSessionModal,
        login,
        register,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
