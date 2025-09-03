import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ui/ProtectedRoute";
import NotFound from "pages/NotFound";
import Landing from './pages/Landing';
import JobSeekerDashboard from './pages/job-seeker-dashboard';
import JobDetails from './pages/job-details';
import EmployerDashboard from './pages/employer-dashboard';
import JobSearchResults from './pages/job-search-results';
import ApplicationTracking from './pages/application-tracking';
import Register from './pages/register';
import Login from './pages/login';
import Profile from './pages/profile';

const Routes = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <ScrollToTop />
          <RouterRoutes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            
            {/* Protected routes */}
            <Route path="/job-seeker-dashboard" element={
              <ProtectedRoute requiredRole="job-seeker">
                <JobSeekerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/employer-dashboard" element={
              <ProtectedRoute requiredRole="employer">
                <EmployerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/job-details" element={
              <ProtectedRoute>
                <JobDetails />
              </ProtectedRoute>
            } />
            <Route path="/job-search-results" element={
              <ProtectedRoute>
                <JobSearchResults />
              </ProtectedRoute>
            } />
            <Route path="/application-tracking" element={
              <ProtectedRoute>
                <ApplicationTracking />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </RouterRoutes>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default Routes;