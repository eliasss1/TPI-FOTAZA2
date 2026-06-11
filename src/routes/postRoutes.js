const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const {estaAutenticado, esModerador} = require('../middlewares/authMiddleware');

router.get('/', postController.mostrarFeed);
router.get('/perfil/:id', estaAutenticado, postController.mostrarPerfil);
router.get('/nueva-publicacion', estaAutenticado, postController.mostrarFormulario);
router.post('/publicaciones/crear', estaAutenticado, postController.crearPublicacion);

router.get('/', postController.mostrarFeed);
router.get('/buscar', postController.buscarPublicaciones);

router.get('/perfil', estaAutenticado, postController.mostrarPerfil);
router.post('/comentar/:id', estaAutenticado, postController.crearComentario);

router.get('/moderacion', estaAutenticado, esModerador, postController.mostrarModeracion);
router.post('/moderacion/rechazar/:id', estaAutenticado, esModerador, postController.rechazarDenuncia);
router.post('/moderacion/aceptar/:id', estaAutenticado, esModerador, postController.aceptarDenuncia);
router.post('/denuncia/:id', estaAutenticado, postController.crearDenuncia);

router.get('/notificaciones', estaAutenticado, postController.mostrarNotificaciones);
router.post('/notificaciones/leer/:id', estaAutenticado, postController.marcarNotificacionLeida);

router.post('/valorar/:id', estaAutenticado, postController.valorarPublicacion);

router.get('/colecciones', estaAutenticado, postController.cargarColecciones)
router.post('/colecciones/guardar/:id', estaAutenticado, postController.crearColeccionYGuardar);
router.get('/colecciones/:id', estaAutenticado, postController.mostrarColeccion);

router.post('/publicaciones/interes/:id', estaAutenticado, postController.registrarInteres);
router.get('/chat/:conUsuarioId', estaAutenticado, postController.mostrarChatPrivado);

module.exports = router;