const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const notiController = require('../controllers/notificacionesController');
const chatController = require('../controllers/chatController');
const perfilController = require('../controllers/perfilController');
const indexController = require('../controllers/indexController');
const nuevaPubliController = require('../controllers/nueva-publicacionController');
const coleccionesController = require('../controllers/coleccionesController');
const moderacionController = require('../controllers/moderacionController');
const layoutController = require('../controllers/layoutController');
const {estaAutenticado, esModerador} = require('../middlewares/authMiddleware');



//RUTAS DE CREAR PUBLICACION
router.get('/nueva-publicacion', estaAutenticado, nuevaPubliController.mostrarFormulario);
router.post('/publicaciones/crear', estaAutenticado, nuevaPubliController.crearPublicacion);

//RUTAS DEL INDEX
router.get('/', indexController.mostrarFeed);

//RUTAS GENERALES
router.get('/buscar', postController.buscarPublicaciones);
router.post('/comentar/:id', estaAutenticado, postController.crearComentario);
router.post('/valorar/:id', estaAutenticado, postController.valorarPublicacion);
router.post('/publicaciones/interes/:id', estaAutenticado, postController.registrarInteres);

//RUTAS MODERACION
router.get('/moderacion', estaAutenticado, esModerador, moderacionController.mostrarModeracion);
router.post('/moderacion/rechazar/:id', estaAutenticado, esModerador, moderacionController.rechazarDenuncia);
router.post('/moderacion/aceptar/:id', estaAutenticado, esModerador, moderacionController.aceptarDenuncia);
router.post('/denuncia/:id', estaAutenticado, postController.crearDenuncia);

//RUTAS NOTIFICACIONES
router.get('/notificaciones', estaAutenticado, notiController.mostrarNotificaciones);
router.post('/notificaciones/leer/:id', estaAutenticado, notiController.marcarNotificacionLeida);
router.get('/publicacion/:id', estaAutenticado, notiController.mostrarPublicacionUnica);

//RUTAS DE COLECCIONES
router.get('/colecciones', estaAutenticado, coleccionesController.cargarColecciones)
router.post('/colecciones/guardar/:id', estaAutenticado, postController.crearColeccionYGuardar);
router.get('/colecciones/:id', estaAutenticado, coleccionesController.mostrarColeccion);

//RUTAS CHAT
router.get('/chat/:conUsuarioId', estaAutenticado, chatController.mostrarChatPrivado);
router.post('/chat/:chatId/enviar', estaAutenticado, chatController.enviarMensaje);
router.get('/mensajes', estaAutenticado, chatController.mostrarBandejaChats);

//RUTAS DE PERFIL
router.get('/perfil', estaAutenticado, perfilController.mostrarPerfil);
router.get('/perfil/:id', estaAutenticado, perfilController.mostrarPerfil);
router.post('/perfil/:id/seguir', estaAutenticado, perfilController.seguirUsuario);

//METODO NO FUNCIONAL: router.get('/siguiendo/', estaAutenticado, perfilController.feedSiguiendo);

module.exports = router;