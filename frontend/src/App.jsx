import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Movimientos from './pages/Movimientos';
import AdminDashboard from './pages/AdminDashboard';
import Cierres from './pages/Cierres';
import ComprobantesPage from './pages/ComprobantesPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Ruta publica */}
            <Route path="/login" element={<Login />} />

            {/* Rutas protegidas */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/movimientos"
              element={
                <ProtectedRoute allowedRoles={['CAJERO_SEDE']}>
                  <Movimientos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cierres"
              element={
                <ProtectedRoute allowedRoles={['CAJERO_SEDE']}>
                  <Cierres />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/comprobantes"
              element={
                <ProtectedRoute allowedRoles={['ADMIN_SISTEMA', 'ADMIN_SEDE']}>
                  <ComprobantesPage />
                </ProtectedRoute>
              }
            />

            {/* Redireccion por defecto */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
