## Caja-El-Asesor
# Caja — Sistema de Gestión de Caja Distribuida

Sistema MERN (MongoDB, Express, React, Node.js) para la gestión contable multi-sede con control de movimientos, cierres de caja globales por sede y generación de reportes PDF.

---

## Tabla de Contenidos

- [Tecnologías](#tecnologías)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Configuración e Instalación](#configuración-e-instalación)
- [Variables de Entorno](#variables-de-entorno)
- [Roles y Permisos](#roles-y-permisos)
- [Endpoints de la API](#endpoints-de-la-api)
- [Modelos de Datos](#modelos-de-datos)
- [Módulos del Frontend](#módulos-del-frontend)
- [Funcionalidad de PDF](#funcionalidad-de-pdf)
- [Credenciales de Prueba](#credenciales-de-prueba)

---

## Tecnologías

| Capa | Tecnología |
|---|---|
| Base de Datos | MongoDB Atlas + Mongoose |
| Backend | Node.js + Express |
| Frontend | React + Vite + Tailwind CSS |
| Autenticación | JWT (JSON Web Tokens) |
| PDF | jsPDF + jspdf-autotable |
| Gráficos | Recharts |

---

## Estructura del Proyecto

```
Caja/
├── backend/
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── cierreController.js       ← Cierres globales por Sede
│   │   ├── movimiento.controller.js  ← Filtrado por Sede para cajeros
│   │   ├── usuario.controller.js
│   │   ├── sede.controller.js
│   │   └── caja.controller.js
│   ├── middlewares/
│   │   └── auth.middleware.js        ← verificarToken + verificarRol
│   ├── models/
│   │   ├── Cierre.js                 ← Referencia a Sede (no Caja)
│   │   ├── Movimiento.js
│   │   ├── Caja.js
│   │   ├── Sede.js
│   │   └── Usuario.js
│   ├── routes/
│   │   ├── cierresRoutes.js
│   │   ├── movimiento.routes.js
│   │   ├── usuario.routes.js
│   │   ├── sede.routes.js
│   │   ├── caja.routes.js
│   │   └── auth.routes.js
│   ├── .env
│   └── server.js
│
└── frontend/
    └── src/
        ├── api/
        │   └── axios.js
        ├── components/
        │   ├── SidebarLayout.jsx     ← Responsive (menú hamburguesa)
        │   ├── PerfilModal.jsx
        │   └── Loader.jsx
        ├── context/
        │   ├── AuthContext.jsx
        │   └── ThemeContext.jsx
        └── pages/
            ├── Login.jsx
            ├── Dashboard.jsx         ← Calendario + Gráficos en tiempo real
            ├── Movimientos.jsx       ← Filtrado por Sede + Buscador
            ├── Cierres.jsx           ← Cierre global por Sede + PDF
            └── AdminDashboard.jsx    ← CRUD con buscadores
```

---

## Configuración e Instalación

### 1. Clonar el repositorio

```bash
git clone <repo-url>
cd Caja
```

### 2. Instalar dependencias del Backend

```bash
cd backend
npm install
```

### 3. Instalar dependencias del Frontend

```bash
cd ../frontend
npm install
```

### 4. Configurar variables de entorno

Crear el archivo `backend/.env` (ver sección siguiente).

### 5. Ejecutar en desarrollo

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

---

## Variables de Entorno

Crear `backend/.env` con el siguiente contenido:

```env
MONGO_URI=mongodb+srv://<usuario>:<password>@<cluster>.mongodb.net/<base_datos>
JWT_SECRET=una_clave_secreta_muy_larga_y_segura
PORT=5000
```

---

## Roles y Permisos

| Rol | Dashboard | Movimientos | Cierres | Admin Panel |
|---|---|---|---|---|
| `ADMINISTRADOR` | ✅ Global (todas las sedes) | ✅ Todos | ❌ | ✅ CRUD completo |
| `CAJERO_SEDE` | ✅ Solo su sede | ✅ Solo su sede | ✅ Solo su sede | ❌ |

> **Aislamiento por Sede**: Un cajero únicamente ve movimientos de las cajas que pertenecen a su sede. El administrador tiene visibilidad global de todo el sistema.

---

## Endpoints de la API

### Autenticación

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/login` | Iniciar sesión, devuelve JWT |

### Usuarios

| Método | Ruta | Descripción | Protección |
|---|---|---|---|
| GET | `/api/usuarios` | Listar todos los usuarios | Token |
| POST | `/api/usuarios` | Crear usuario | Token |
| PUT | `/api/usuarios/:id` | Editar usuario | Token |
| DELETE | `/api/usuarios/:id` | Eliminar usuario | Token |

### Sedes

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/sedes` | Listar todas las sedes |
| GET | `/api/sedes/:id` | Obtener una sede por ID |
| POST | `/api/sedes` | Crear sede |
| PUT | `/api/sedes/:id` | Editar sede |
| DELETE | `/api/sedes/:id` | Eliminar sede |

### Cajas

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/cajas` | Listar todas las cajas |
| GET | `/api/cajas/sede/:idSede` | Cajas de una sede específica |
| POST | `/api/cajas` | Crear caja |
| PUT | `/api/cajas/:id` | Editar caja |
| DELETE | `/api/cajas/:id` | Eliminar caja |

### Movimientos

| Método | Ruta | Descripción | Protección |
|---|---|---|---|
| GET | `/api/movimientos` | Listar movimientos (filtrado por sede si es cajero) | Token |
| GET | `/api/movimientos/caja/:idCaja` | Movimientos de una caja | Token |
| POST | `/api/movimientos` | Registrar movimiento | Token + Rol CAJERO_SEDE |

### Cierres ← **Módulo Principal**

| Método | Ruta | Descripción | Protección |
|---|---|---|---|
| GET | `/api/cierres` | Historial de cierres de la sede | Token |
| GET | `/api/cierres/resumen/diario?dias=31` | Resumen diario para el calendario | Token |
| GET | `/api/cierres/resumen/mensual` | Resumen mensual | Token |
| GET | `/api/cierres/previsualizar/sede` | Pre-cierre: totales actuales de la sede | Token + Cajero |
| GET | `/api/cierres/movimientos-periodo?tipo=DIARIO&fecha=YYYY-MM-DD` | Movimientos del período (para PDF) | Token + Cajero |
| POST | `/api/cierres` | Registrar cierre global de la sede | Token + Cajero |

#### Parámetros del endpoint `movimientos-periodo`

| Parámetro | Valores | Descripción |
|---|---|---|
| `tipo` | `DIARIO` \| `MENSUAL` | Período a consultar |
| `fecha` | `YYYY-MM-DD` (diario) o `YYYY-MM` (mensual) | Fecha del período |

---

## Modelos de Datos

### Usuario

```js
{
  nombre: String,
  login_usuario: String,       // Único
  password: String,            // Hasheado con bcrypt
  rol: 'ADMINISTRADOR' | 'CAJERO_SEDE',
  id_sede: ObjectId → Sede     // Solo para CAJERO_SEDE
}
```

### Sede

```js
{
  nombre: String,
  direccion: String,
  estado: Boolean              // true = Activa
}
```

### Caja

```js
{
  codigo: String,              // Ej: "001"
  nombre_caja: String,         // Ej: "Interbank"
  id_sede: ObjectId → Sede,
  saldo_actual: Number,
  saldo_minimo: Number,
  saldo_maximo: Number
}
```

### Movimiento

```js
{
  id_caja: ObjectId → Caja,
  id_usuario: ObjectId → Usuario,
  tipo: Boolean,               // false = ENTRADA, true = SALIDA
  concepto: String,
  monto: Number,
  saldo_resultante: Number,    // Saldo de la caja después del movimiento
  tiene_recibo: Boolean,
  nro_recibo: String,
  motivo_sin_recibo: String,
  fecha_hora: Date
}
```

### Cierre (Global por Sede)

```js
{
  id_sede: ObjectId → Sede,    // Cierre aplica a TODA la sede
  id_usuario: ObjectId → Usuario,
  tipo: 'DIARIO' | 'MENSUAL',
  fecha_inicio: Date,          // Desde cuándo se cuentan los movimientos
  fecha_cierre: Date,          // Cuándo se ejecutó el cierre
  saldo_apertura: Number,      // Saldo real del último cierre
  total_ingresos: Number,      // Suma de todas las entradas de la sede
  total_egresos: Number,       // Suma de todas las salidas de la sede
  saldo_esperado: Number,      // apertura + ingresos - egresos
  saldo_real: Number,          // Dinero físico declarado por el cajero
  diferencia: Number,          // saldo_real - saldo_esperado
  total_movimientos: Number,   // Cantidad de operaciones en el período
  observaciones: String
}
```

---

## Módulos del Frontend

### Dashboard (`/dashboard`)

- Muestra tarjetas resumen: Sedes, Cajas, Saldo Total.
- Tabla de cajas por sede con barra de progreso de capacidad.
- **Calendario interactivo**: cada día muestra indicadores de actividad (verde = ingresos, rojo = egresos).
- Al seleccionar un día del calendario, muestra:
  - Gráfico de distribución de saldos (Pie Chart).
  - Gráfico de capacidad de cajas Actual vs. Máximo (Bar Chart).
- Datos del calendario se actualizan automáticamente cada 30 segundos.

### Movimientos (`/movimientos`)

- Formulario para registrar ingresos y egresos.
- Buscador en tiempo real para filtrar el historial por concepto o código de caja.
- El cajero solo ve los movimientos de su sede.
- El administrador ve todos los movimientos del sistema.

### Cierres (`/cierres`) ← **Solo para Cajeros**

- **Sin selector de caja**: el cierre es global y agrupa automáticamente todas las cajas de la sede.
- Panel de "Estado Actual de la Sede" con previsualización en tiempo real de:
  - Total de ingresos y egresos pendientes de cierre.
  - Saldo esperado del sistema.
  - Número de movimientos y cajas incluidas.
  - Diferencia al ingresar el saldo físico.
- Registrar Cierre Diario o Mensual con saldo físico real y observaciones.
- Historial de cierres con: sede, tipo, movimientos, ingresos, egresos y diferencia.
- **Generación de PDF** (ver sección siguiente).

### Panel de Administración (`/admin`) ← **Solo Administrador**

- CRUD de Usuarios (con sede asignada).
- CRUD de Sedes.
- CRUD de Tipos de Caja (asignadas a sede).
- Buscador en tiempo real en cada módulo.

---

## Funcionalidad de PDF

Los reportes PDF se generan directamente en el navegador usando `jsPDF` y `jspdf-autotable`, sin necesitar procesamiento en el servidor.

### Botones disponibles (en pantalla de Cierres)

| Botón | Período | Nombre del archivo generado |
|---|---|---|
| **PDF Hoy** | Movimientos del día actual | `cierre_diario_YYYY-MM-DD.pdf` |
| **PDF Mes** | Movimientos del mes actual | `cierre_mensual_YYYY-MM-DD.pdf` |

### Contenido del PDF

1. **Cabecera corporativa**: fondo azul marino con nombre del reporte, tipo de cierre y nombre de la sede.
2. **Resumen del período**: ingresos totales, egresos totales, neto, fecha de inicio y número de movimientos.
3. **Tabla detallada**: columnas de Fecha, Cód. de Caja, Nombre de Caja, Tipo (ENTRADA/SALIDA en colores), Concepto, Monto y Saldo Resultante.
4. **Pie de página**: fecha de generación y número de página.

---

## Credenciales de Prueba

| Usuario | Contraseña | Rol | Sede |
|---|---|---|---|
| `admin` | `admin123` | ADMINISTRADOR | — (acceso global) |
| `juan` | `juan123` | CAJERO_SEDE | Sede Principal |
| `ana` | `ana123` | CAJERO_SEDE | Sede Norte |
| `rosa` | `rosa123` | CAJERO_SEDE | Sede Sur |

> **Nota**: Las contraseñas exactas dependen del script de seed ejecutado. Verificar en la base de datos si los logins son diferentes.

---

## Notas para el Desarrollador

### Seguridad
- Todos los endpoints de la API requieren el header `Authorization: Bearer <token>`.
- El token JWT expira según la configuración de `JWT_SECRET`. Si ves errores 403, cierra sesión y vuelve a iniciar.
- El middleware `verificarRol('CAJERO_SEDE')` bloquea acceso a cierres y movimientos de escritura para el administrador.

### Transacciones
- La creación de movimientos usa `mongoose.startSession()` para garantizar atomicidad: si falla la actualización del saldo de la caja, el movimiento tampoco se guarda.

### Actualización en Tiempo Real
- El Dashboard consulta `/api/cierres/resumen/diario` cada 30 segundos usando `setInterval`.
- La previsualización de cierre se actualiza al cargar la página de Cierres.

### Cambio de Esquema (Cierres)
- A partir de esta versión, el modelo `Cierre` referencia `id_sede` en lugar de `id_caja`.
- Los cierres anteriores (si los hay) que referenciaban una caja individual ya no serán visibles en la interfaz y pueden eliminarse de la base de datos con:

```js
// Ejecutar en MongoDB Shell o Compass
db.cierres.deleteMany({})
```
