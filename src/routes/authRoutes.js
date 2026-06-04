const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
// Rutas de autenticación
router.get('/login', authController.mostrarLogin);
router.post('/login', authController.procesarLogin);
//rutas de registro
router.get('/registro', authController.mostrarRegistro);
router.post('/registro', authController.procesarRegistro);
module.exports = router;