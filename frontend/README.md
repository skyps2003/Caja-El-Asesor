# 🎨 Frontend — Caja JJJA S.R.L.

![React](https://img-shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img-shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
![Tailwind CSS](https://img-shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

Este es el cliente visual de la plataforma de control financiero de **Corporación Interoceánica JJJA S.R.L.**, construido con **React 19** y **Vite**.

## 🚀 Características Clave

- **Sistema de Diseño Premium:** Uso intensivo de paletas corporativas ("Midnight & Gray") implementadas a través de variables CSS nativas y utilidades de TailwindCSS.
- **Glassmorphism & Animaciones:** Interfaces fluidas con desenfoques, sombras dinámicas y transiciones suaves para una experiencia de usuario de alto nivel.
- **Gráficos e Informes:** Integración profunda con `recharts` para dashboards interactivos (ej. gráficos de anillos) y `jsPDF` / `exceljs` para exportación de actas financieras.
- **Modales UX:** Eliminación de alertas nativas del navegador a favor de modales customizados para proteger acciones destructivas (ej. eliminación de registros).

## ⚙️ Scripts Disponibles

En el directorio del proyecto, puedes ejecutar:

### `npm install`
Instala todas las dependencias necesarias definidas en el `package.json`.

### `npm run dev`
Levanta la aplicación en modo desarrollo.
Abre [http://localhost:5173](http://localhost:5173) para verlo en el navegador. La página se recargará si realizas ediciones (HMR).

### `npm run build`
Construye la aplicación para producción en la carpeta `dist`.
Empaqueta React correctamente en modo producción y optimiza los archivos (minificación y versionado) para un mejor rendimiento.

## 🌐 Configuración de Proxy (Vite)

Las peticiones a la API se canalizan automáticamente a través del proxy configurado en `vite.config.js`. Asegúrate de que el backend esté ejecutándose en el puerto `5000` (o ajusta el puerto en el proxy si tu entorno local es diferente).

```js
// vite.config.js
server: {
  proxy: {
    '/api': 'http://localhost:5000',
    '/uploads': 'http://localhost:5000',
  },
}
```

## 📂 Estructura de Directorios

- `/src/api`: Interceptores de Axios para inyección de JWT.
- `/src/components`: Componentes atómicos y layouts (TopBar, Sidebar, Modales).
- `/src/context`: Estados globales (`AuthContext`, `ThemeContext`).
- `/src/pages`: Vistas principales enrutadas (Dashboard, Admin, Movimientos).
- `/src/styles`: Archivos CSS globales y tokens de diseño.
