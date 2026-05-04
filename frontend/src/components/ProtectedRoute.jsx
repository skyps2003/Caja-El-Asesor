import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SidebarLayout from './SidebarLayout';
import Loader from './Loader';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return <Loader />;
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(usuario.rol)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <SidebarLayout>{children}</SidebarLayout>;
};

export default ProtectedRoute;
