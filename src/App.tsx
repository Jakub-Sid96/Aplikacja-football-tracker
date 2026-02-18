import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { AppProvider } from './AppContext';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import AppHeader from './components/AppHeader';
import ParentDashboard from './components/ParentDashboard';
import ParentSessionList from './components/ParentSessionList';
import ParentReportForm from './components/ParentReportForm';
import TrainerDashboard from './components/TrainerDashboard';
import GroupView from './components/GroupView';
import SessionBuilder from './components/SessionBuilder';
import ChildNotebook from './components/ChildNotebook';
import './App.css';

// ============================================================
// Routing aplikacji:
//
// PUBLICZNE:
//   /login              → logowanie
//   /register           → rejestracja (wybór roli)
//
// RODZIC (chronione):
//   /parent             → dashboard rodzica (dzieci, prośby)
//   /parent/sessions/:childId     → lista raportów postępów dla dziecka
//   /parent/report/:sessionId/:childId → formularz raportu
//
// TRENER (chronione):
//   /trainer                                → dashboard (grupy + prośby)
//   /trainer/group/:groupId                 → widok grupy (raporty postępów + zawodnicy)
//   /trainer/group/:groupId/new-session     → kreator nowego raportu postępów w grupie
//   /trainer/group/:groupId/child/:childId  → notatnik zawodnika w grupie
// ============================================================

// Wrapper: wymaga zalogowania
const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: 'parent' | 'trainer' }> = ({
  children,
  requiredRole,
}) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && currentUser.role !== requiredRole) {
    return <Navigate to={currentUser.role === 'trainer' ? '/trainer' : '/parent'} replace />;
  }

  return <>{children}</>;
};

// Wrapper: przekieruj zalogowanych na dashboard
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  if (currentUser) {
    return <Navigate to={currentUser.role === 'trainer' ? '/trainer' : '/parent'} replace />;
  }

  return <>{children}</>;
};

// Główny layout dla zalogowanych – header + content
const AuthenticatedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      <AppHeader />
      <main>{children}</main>
    </>
  );
};

const AppRoutes: React.FC = () => {
  return (
    <div className="app">
      <Routes>
        {/* Publiczne – logowanie/rejestracja */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* Rodzic */}
        <Route path="/parent" element={
          <ProtectedRoute requiredRole="parent">
            <AuthenticatedLayout><ParentDashboard /></AuthenticatedLayout>
          </ProtectedRoute>
        } />
        <Route path="/parent/sessions/:childId" element={
          <ProtectedRoute requiredRole="parent">
            <AuthenticatedLayout><ParentSessionList /></AuthenticatedLayout>
          </ProtectedRoute>
        } />
        <Route path="/parent/report/:sessionId/:childId" element={
          <ProtectedRoute requiredRole="parent">
            <AuthenticatedLayout><ParentReportForm /></AuthenticatedLayout>
          </ProtectedRoute>
        } />

        {/* Trener */}
        <Route path="/trainer" element={
          <ProtectedRoute requiredRole="trainer">
            <AuthenticatedLayout><TrainerDashboard /></AuthenticatedLayout>
          </ProtectedRoute>
        } />
        <Route path="/trainer/group/:groupId" element={
          <ProtectedRoute requiredRole="trainer">
            <AuthenticatedLayout><GroupView /></AuthenticatedLayout>
          </ProtectedRoute>
        } />
        <Route path="/trainer/group/:groupId/new-session" element={
          <ProtectedRoute requiredRole="trainer">
            <AuthenticatedLayout><SessionBuilder /></AuthenticatedLayout>
          </ProtectedRoute>
        } />
        <Route path="/trainer/group/:groupId/child/:childId" element={
          <ProtectedRoute requiredRole="trainer">
            <AuthenticatedLayout><ChildNotebook /></AuthenticatedLayout>
          </ProtectedRoute>
        } />

        {/* Domyślne przekierowanie */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
