const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const estaAutenticado = require('../middlewares/authMiddleware');

router.get('/', postController.mostrarFeed);
router.get('/nueva-publicacion', estaAutenticado, postController.mostrarFormulario);
router.post('/publicaciones/crear', estaAutenticado, postController.crearPublicacion);

router.get('/perfil', estaAutenticado, postController.mostrarPerfil);
router.post('/comentar/:id', estaAutenticado, postController.crearComentario);

module.exports = router;