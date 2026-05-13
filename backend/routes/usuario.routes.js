const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const { crearUsuario, obtenerUsuarios, obtenerUsuarioPorId, actualizarUsuario, eliminarUsuario, actualizarAvatar } = require('../controllers/usuario.controller');

// Configuración de Multer para subir fotos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `avatar-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Máximo 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, webp)'));
  }
});

const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

router.post('/', verificarToken, verificarRol('ADMINISTRADOR'), crearUsuario);
router.get('/', verificarToken, obtenerUsuarios);
router.get('/:id', verificarToken, obtenerUsuarioPorId);
router.put('/:id', verificarToken, actualizarUsuario);
router.delete('/:id', verificarToken, verificarRol('ADMINISTRADOR'), eliminarUsuario);

// Ruta para subir la foto de perfil
router.post('/upload-avatar/:id', verificarToken, upload.single('foto'), actualizarAvatar);

module.exports = router;
