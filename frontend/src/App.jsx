import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import Login      from './pages/Login';
import Dashboard  from './pages/Dashboard';
import Logs       from './pages/Logs';
import Alerts     from './pages/Alerts';
import Servers    from './pages/Servers';
import Profile    from './pages/Profile';
import Loader     from './components/Loader';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader fullscreen />;
  return user ? children : <Navigate to="/login" replace />;
};

export default function App() {
  const { loading } = useAuth();
  if (loading) return <Loader fullscreen />;

  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="logs"      element={<Logs />} />
          <Route path="alerts"    element={<Alerts />} />
          <Route path="servers"   element={<Servers />} />
          <Route path="profile"   element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AnimatePresence>
  );
}