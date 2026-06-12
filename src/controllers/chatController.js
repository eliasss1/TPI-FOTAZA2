const { Op } = require('sequelize');
const {
    Publicacion,
    Imagen,
    Usuario,
    Comentario,
    Notificacion,
    Denuncia,
    Coleccion,
    Valoracion,
    Etiqueta
} = require("../models");
const formidable = require("formidable");
const fs = require("fs");
const path = require("path");

module.exports = {

    mostrarChatPrivado: async (req, res) => {
        try {
            const miId = req.session.usuario.id;
            const conUsuarioId = req.params.conUsuarioId;

            const otroUsuario = await Usuario.findByPk(conUsuarioId, { attributes: ['id', 'username' ]});
            if (!otroUsuario) return res.redirect('/');

            res.render('chat', {
                titulo: `Chat con ${otroUsuario.username}`,
                usuarioPerfil: otroUsuario
            });
        } catch (error) {
            console.error("Error al cargar el chat:", error);
            res.status(500).send("Error interno");
        }
    },

};