# ⚙️ Backend — Caja JJJA S.R.L.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white)

Este es el servidor RESTful de la plataforma financiera de **Corporación Interoceánica JJJA S.R.L.**, diseñado con Express.js y Mongoose.

## 🚀 Características Clave

- **Transacciones Atómicas:** Uso riguroso de `mongoose.startSession()` en la creación de movimientos para garantizar que el historial y el `saldo_actual` de cada caja permanezcan perfectamente sincronizados.
- **Autenticación Basada en JWT:** Endpoints asegurados mediante tokens, con validaciones estrictas de roles (`ADMINISTRADOR` vs `CAJERO_SEDE`).
- **Motor de Cierres:** Automatización contable que diferencia cierres Diarios (Arqueos visuales) de cierres Mensuales (Retiros automatizados de fondos que resetean saldos a cero).
- **Gestión de Archivos:** Integración nativa con Multer para la subida asíncrona de avatares de perfil.

## ⚙️ Instalación y Entorno

1. Entra al directorio del backend e instala las dependencias:
   ```bash
   npm install
   ```

2. Crea un archivo `.env` en la raíz de la carpeta `backend` basado en este formato:
   ```env
   # Puerto en el que correrá el servidor
   PORT=5000

   # Cadena de conexión a MongoDB (Atlas o Local)
   MONGO_URI=mongodb+srv://<usuario>:<password>@cluster.mongodb.net/<database>?retryWrites=true&w=majority

   # Clave secreta para firmar los JSON Web Tokens
   JWT_SECRET=tu_clave_super_secreta_aqui
   ```

## 📜 Scripts de Base de Datos

- **`npm run dev`**: Ejecuta el servidor en modo desarrollo utilizando `nodemon` (reinicio automático ante cambios).
- **`npm run seed`**: ⚠️ **ATENCIÓN**. Este script limpia la base de datos entera (elimina movimientos, cierres, cajas y usuarios). Tras el borrado, inyecta las Sedes base, las Cajas en `0.00` y crea al usuario maestro (`admi` / `admi`). Ideal para reiniciar la contabilidad o desplegar un entorno de QA.

## 📂 Estructura de Rutas Base

- `POST /api/auth/login` - Autenticación y generación de JWT
- `GET/POST/PUT/DELETE /api/usuarios` - CRUD de Usuarios
- `GET/POST/PUT/DELETE /api/cajas` - CRUD de Cajas
- `POST /api/movimientos` - Registro atómico de ingresos/egresos
- `POST /api/cierres` - Ejecución y validación del cierre de sede
- `GET /api/reportes/mensual` - Generación de exportables en Excel
