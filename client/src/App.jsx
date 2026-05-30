import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import CalendarPage from './pages/CalendarPage';
import LoginPage from './pages/LoginPage';
import MyTasksPage from './pages/MyTasksPage';
import ProjectBoardPage from './pages/ProjectBoardPage';
import ProjectsPage from './pages/ProjectsPage';
import RegisterPage from './pages/RegisterPage';
import SettingsPage from './pages/SettingsPage';
import { AuthProvider } from './context/AuthContext';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<DashboardPage />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/my-tasks" element={<MyTasksPage />} />
      <Route path="/projects" element={<ProjectsPage />} />
      <Route path="/projects/:projectId" element={<ProjectBoardPage />} />
      <Route path="/settings" element={<SettingsPage />} />
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
