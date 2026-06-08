const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');

router.get('/', postController.mostrarFeed);
router.get('/nueva-publicacion', postController.mostrarFormulario);
router.post('/publicaciones/crear', postController.crearPublicacion);

module.exports = router;