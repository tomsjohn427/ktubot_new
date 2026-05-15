import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import BottomNav from './components/BottomNav';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';
import ChatsPage from './pages/ChatsPage';
import SubjectsPage from './pages/SubjectsPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import AdminPage from './pages/AdminPage';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/home" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login"    element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/home'} replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/home" replace /> : <RegisterPage />} />
      <Route path="/home"     element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="/chat/:subjectId"         element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
      <Route path="/chat/:subjectId/:chatId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
      <Route path="/chats"    element={<ProtectedRoute><ChatsPage /></ProtectedRoute>} />
      <Route path="/subjects" element={<ProtectedRoute><SubjectsPage /></ProtectedRoute>} />
      <Route path="/profile"  element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/admin"    element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/manage" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
      <Route path="/" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/home'} replace /> : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function Layout() {
  const { user } = useAuth();
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden' }}>
      <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
        <AppRoutes />
      </div>
      {user && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout />
      </AuthProvider>
    </BrowserRouter>
  );
}