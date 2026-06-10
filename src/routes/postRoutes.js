const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const {estaAutenticado, esModerador} = require('../middlewares/authMiddleware');

router.get('/', postController.mostrarFeed);
router.get('/perfil/:id', estaAutenticado, postController.mostrarPerfil);
router.get('/nueva-publicacion', estaAutenticado, postController.mostrarFormulario);
router.post('/publicaciones/crear', estaAutenticado, postController.crearPublicacion);

router.get('/perfil', estaAutenticado, postController.mostrarPerfil);
router.post('/comentar/:id', estaAutenticado, postController.crearComentario);

router.get('/moderacion', estaAutenticado, esModerador, (req, res) => {
    res.render('moderacion');
});
router.post('/denuncia/:id', estaAutenticado, postController.crearDenuncia);

router.get('/notificaciones', estaAutenticado, postController.mostrarNotificaciones);
router.post('/notificaciones/leer/:id', estaAutenticado, postController.marcarNotificacionLeida);

module.exports = router;