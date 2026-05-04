import React from 'react';

const Loader = ({ mensaje = "Cargando..." }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--c-fondo)] fixed inset-0 z-[100]">
      <div className="relative flex items-center justify-center mb-6">
        {/* Anillos de animación */}
        <div className="absolute w-20 h-20 border-4 border-[var(--c-accion)] border-t-transparent rounded-full animate-spin opacity-80" />
        <div className="absolute w-16 h-16 border-4 border-[var(--c-primario)] border-b-transparent rounded-full animate-[spin_1.5s_linear_infinite_reverse] opacity-60" />
        <div className="absolute w-12 h-12 border-4 border-[var(--c-texto-sub)] border-l-transparent rounded-full animate-[spin_2s_linear_infinite] opacity-40" />
        
        {/* Ícono central */}
        <div className="w-8 h-8 rounded-full bg-[var(--c-fondo-card)] shadow-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-[var(--c-accion)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>
      <p className="text-[var(--c-texto)] font-medium text-sm tracking-widest uppercase animate-pulse">
        {mensaje}
      </p>
    </div>
  );
};

export default Loader;
