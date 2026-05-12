import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/NavBar.css';

const NavBar = () => {
  const { usuario, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const getMenuItems = () => {
    const baseItems = [
      { path: '/dashboard', label: 'Inicio', icon: '📊' },
    ];

    if (usuario?.rol === 'CAJERO_SEDE') {
      baseItems.push(
        { path: '/movimientos', label: 'Movimientos', icon: '💸' },
        { path: '/cierres', label: 'Cierres', icon: '📋' }
      );
    }

    if (['ADMIN_SISTEMA', 'ADMIN_SEDE'].includes(usuario?.rol)) {
      baseItems.push(
        { path: '/admin', label: 'Administración', icon: '⚙️' },
        { path: '/comprobantes', label: 'Comprobantes', icon: '📄' }
      );
    }

    return baseItems;
  };

  const menuItems = getMenuItems();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <img src="/loggo.png" alt="Estudio Contable El Asesor" className="brand-logo" />
          <img src="/letras.png" alt="Estudio Contable El Asesor" className="brand-text-image" />
        </Link>

        <ul className="navbar-menu">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`navbar-link ${isActive(item.path) ? 'active' : ''}`}
              >
                <span className="menu-icon">{item.icon}</span>
                <span className="menu-label">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="navbar-user">
          <div className="user-info">
            <span className="user-name">{usuario?.nombre}</span>
            <span className="user-role">{usuario?.rol}</span>
          </div>
          <button className="btn-logout" onClick={logout}>
            Salir
          </button>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
