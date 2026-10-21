import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";

// Components
import { Navbar } from "./components/common/Navbar";
import { Footer } from "./components/common/Footer";
import { SessionTerminatedModal } from "./components/common/SessionTerminatedModal";

// Public Pages
import { Home } from "./pages/public/Home";
import { Courses } from "./pages/public/Courses";
import { CourseDetails } from "./pages/public/CourseDetails";
import { Login } from "./pages/public/Login";
import { Register } from "./pages/public/Register";
import { ForgotPassword } from "./pages/public/ForgotPassword";
import { ResetPassword } from "./pages/public/ResetPassword";
import {
  About,
  Contact,
  PrivacyPolicy,
  TermsAndConditions,
  RefundPolicy,
} from "./pages/public/StaticPages";

// Student Pages
import { Dashboard } from "./pages/student/Dashboard";
import { MyCourses } from "./pages/student/MyCourses";
import { LearningPage } from "./pages/student/LearningPage";
import { OrderHistory } from "./pages/student/OrderHistory";
import { Profile } from "./pages/student/Profile";

// Admin Pages
import { AdminLayout } from "./components/admin/AdminLayout";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminCourses } from "./pages/admin/AdminCourses";
import { AdminCurriculumEditor } from "./pages/admin/AdminCurriculumEditor";
import { AdminStudents } from "./pages/admin/AdminStudents";
import { AdminOrders } from "./pages/admin/AdminOrders";
import { AdminSettings } from "./pages/admin/AdminSettings";

// Route Guards
const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const AdminRoute = () => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return isAuthenticated && isAdmin ? <Outlet /> : <Navigate to="/login" replace />;
};

// Standard Layout with Navbar and Footer
const StandardLayout = () => (
  <div className="flex flex-col min-h-screen">
    <Navbar />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
  </div>
);

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          {/* Global single-session termination notification modal */}
          <SessionTerminatedModal />

          <Routes>
            {/* Public and Student Standard Shell */}
            <Route element={<StandardLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/courses/:slug" element={<CourseDetails />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
              <Route path="/refund-policy" element={<RefundPolicy />} />

              {/* Protected Student Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/student/dashboard" element={<Dashboard />} />
                <Route path="/student/courses" element={<MyCourses />} />
                <Route path="/student/orders" element={<OrderHistory />} />
                <Route path="/student/profile" element={<Profile />} />
              </Route>
            </Route>

            {/* Distraction-Free Learning Interface */}
            <Route element={<ProtectedRoute />}>
              <Route path="/learning/:slug" element={<LearningPage />} />
            </Route>

            {/* Admin Management Panel */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="courses" element={<AdminCourses />} />
                <Route path="courses/:courseId/curriculum" element={<AdminCurriculumEditor />} />
                <Route path="students" element={<AdminStudents />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
            </Route>

            {/* 404 Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
