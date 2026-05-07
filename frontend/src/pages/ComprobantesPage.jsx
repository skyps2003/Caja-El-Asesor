import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ComprobantesPendientes from '../components/ComprobantesPendientes';
import SidebarLayout from '../components/SidebarLayout';
import '../styles/ComprobantesPage.css';

const ComprobantesPage = () => {
  const { usuario } = useAuth();

  // Solo permitir acceso a admin o admin de sede
  const esAdmin = ['ADMIN_SISTEMA', 'ADMIN_SEDE'].includes(usuario?.rol);

  if (!esAdmin) {
    return (
      <div className="container">
        <p>Acceso denegado. Solo administradores pueden ver esta página.</p>
      </div>
    );
  }

  return (
    <SidebarLayout>
      <div className="comprobantes-page">
        <ComprobantesPendientes />
      </div>
    </SidebarLayout>
  );
};

export default ComprobantesPage;
