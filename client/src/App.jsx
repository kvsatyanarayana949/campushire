import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import api from './api/axios';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { BackendStatusProvider } from './context/BackendStatusContext';
import BackendStatusIndicator from './components/common/BackendStatusIndicator';

// Layouts
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import JobsPage from './pages/public/JobsPage';
import JobDetailsPage from './pages/public/JobDetailsPage';
import LoginPage from './pages/public/LoginPage';
import RegisterStudentPage from './pages/public/RegisterStudentPage';
import RegisterRecruiterPage from './pages/public/RegisterRecruiterPage';
import NotFoundPage from './pages/public/NotFoundPage';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentProfile from './pages/student/StudentProfile';
import MyApplications from './pages/student/MyApplications';
import StudentNotifications from './pages/student/StudentNotifications';

// Recruiter Pages
import RecruiterDashboard from './pages/recruiter/RecruiterDashboard';
import CreateJobPage from './pages/recruiter/CreateJobPage';
import ManageJobsPage from './pages/recruiter/ManageJobsPage';
import JobApplicantsPage from './pages/recruiter/JobApplicantsPage';
import RecruiterProfile from './pages/recruiter/RecruiterProfile';
import StudentsDirectoryPage from './pages/recruiter/StudentsDirectoryPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagementPage from './pages/admin/UserManagementPage';
import AdminJobsPage from './pages/admin/AdminJobsPage';
import AdminApplicationsPage from './pages/admin/AdminApplicationsPage';

function App() {
  useEffect(() => {
    // Proactive background ping: wakes up backend service immediately on any page entry
    api.get('/health').catch(() => {});
  }, []);

  return (
    <ToastProvider>
      <AuthProvider>
        <BackendStatusProvider>
          <Routes>
            {/* Public Website */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/jobs" element={<JobsPage />} />
              <Route path="/jobs/:id" element={<JobDetailsPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register/student" element={<RegisterStudentPage />} />
              <Route path="/register/recruiter" element={<RegisterRecruiterPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Student Candidate Portal */}
            <Route element={<DashboardLayout allowedRoles={['STUDENT']} />}>
              <Route path="/student" element={<StudentDashboard />} />
              <Route path="/student/profile" element={<StudentProfile />} />
              <Route path="/student/applications" element={<MyApplications />} />
              <Route path="/student/notifications" element={<StudentNotifications />} />
            </Route>

            {/* Recruiter Enterprise Hub */}
            <Route element={<DashboardLayout allowedRoles={['RECRUITER']} />}>
              <Route path="/recruiter" element={<RecruiterDashboard />} />
              <Route path="/recruiter/jobs/new" element={<CreateJobPage />} />
              <Route path="/recruiter/jobs" element={<ManageJobsPage />} />
              <Route path="/recruiter/jobs/:jobId/applicants" element={<JobApplicantsPage />} />
              <Route path="/recruiter/profile" element={<RecruiterProfile />} />
              <Route path="/recruiter/students" element={<StudentsDirectoryPage />} />
            </Route>

            {/* Institutional Administration Console */}
            <Route element={<DashboardLayout allowedRoles={['ADMIN']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<UserManagementPage />} />
              <Route path="/admin/jobs" element={<AdminJobsPage />} />
              <Route path="/admin/applications" element={<AdminApplicationsPage />} />
            </Route>
          </Routes>

          {/* Global Subtle Backend Status Indicator */}
          <BackendStatusIndicator />
        </BackendStatusProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
