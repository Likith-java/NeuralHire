/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import SignIn from './pages/SignIn';
import RecruiterDashboard from './pages/RecruiterDashboard';
import InterviewRoom from './pages/InterviewRoom';
import EvaluationReport from './pages/EvaluationReport';
import RecruiterLogin from './pages/RecruiterLogin';
import RecruiterSignup from './pages/RecruiterSignup';
import RecruiterForgotPassword from './pages/RecruiterForgotPassword';
import { ToastProvider } from './context/ToastContext';
import { isLoggedIn } from './utils/auth';

const ProtectedRoute = ({ children, allowedRole }: { children: React.ReactNode, allowedRole: string }) => {
  const role = localStorage.getItem('neural_role');
  if (role !== allowedRole) {
    return <Navigate to="/signin" replace />;
  }
  return <>{children}</>;
};

const RequireRecruiterAuth = ({ children }: { children: React.ReactNode }) => {
  if (!isLoggedIn()) {
    return <Navigate to="/recruiter/login" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  return (
    <ToastProvider>
      <Router>
        <div className="relative min-h-screen bg-background selection:bg-primary/30 selection:text-primary">
          {/* Visual Overlays */}
          <div className="grid-overlay" />

          {/* Layout */}
          <div className="relative z-10 flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/signin" element={<SignIn />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute allowedRole="recruiter">
                      <RecruiterDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/interview"
                  element={
                    <ProtectedRoute allowedRole="candidate">
                      <InterviewRoom />
                    </ProtectedRoute>
                  }
                />
                <Route path="/report/:sessionId" element={<EvaluationReport />} />
                <Route path="/recruiter/login" element={<RecruiterLogin />} />
                <Route path="/recruiter/signup" element={<RecruiterSignup />} />
                <Route path="/recruiter/forgot-password" element={<RecruiterForgotPassword />} />
                <Route
                  path="/dashboard"
                  element={
                    <RequireRecruiterAuth>
                      <RecruiterDashboard />
                    </RequireRecruiterAuth>
                  }
                />
              </Routes>
            </main>

            <footer className="py-6 px-8 border-t border-border/50 text-center">
              <p className="text-[10px] font-mono text-text-muted tracking-[0.3em] uppercase">
                NeuralHire OS v1.0.4 // Secure Evaluation Protocol Active
              </p>
            </footer>
          </div>
        </div>
      </Router>
    </ToastProvider>
  );
}
