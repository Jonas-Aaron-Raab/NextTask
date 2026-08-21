import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import AuditLogPage from './pages/AuditLogPage';
import ApprovalsPage from './pages/ApprovalsPage';
import CalendarPage from './pages/CalendarPage';
import DocumentsPage from './pages/DocumentsPage';
import LoginPage from './pages/LoginPage';
import MyTasksPage from './pages/MyTasksPage';
import ProjectBoardPage from './pages/ProjectBoardPage';
import ProjectsPage from './pages/ProjectsPage';
import ReportsPage from './pages/ReportsPage';
import RegisterPage from './pages/RegisterPage';
import RoleManagementPage from './pages/RoleManagementPage';
import SettingsPage from './pages/SettingsPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { canManageRoles } from './data/bankOrganization';

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

function PublicOnly({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const target = location.state?.from?.pathname || '/';

  if (isAuthenticated) {
    return <Navigate to={target} replace />;
  }

  return children;
}

function RequireAuditAccess({ children }) {
  const { user } = useAuth();

  if (!canManageRoles(user)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><RegisterPage /></PublicOnly>} />
      <Route path="/" element={<RequireAuth><DashboardPage /></RequireAuth>} />
      <Route path="/departments" element={<Navigate to="/projects" replace />} />
      <Route path="/calendar" element={<RequireAuth><CalendarPage /></RequireAuth>} />
      <Route path="/documents" element={<RequireAuth><DocumentsPage /></RequireAuth>} />
      <Route path="/my-tasks" element={<RequireAuth><MyTasksPage /></RequireAuth>} />
      <Route path="/approvals" element={<RequireAuth><ApprovalsPage /></RequireAuth>} />
      <Route path="/projects" element={<RequireAuth><ProjectsPage /></RequireAuth>} />
      <Route path="/projects/:projectId" element={<RequireAuth><ProjectBoardPage /></RequireAuth>} />
      <Route path="/reports" element={<RequireAuth><ReportsPage /></RequireAuth>} />
      <Route path="/roles" element={<RequireAuth><RoleManagementPage /></RequireAuth>} />
      <Route path="/audit-log" element={<RequireAuth><RequireAuditAccess><AuditLogPage /></RequireAuditAccess></RequireAuth>} />
      <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
