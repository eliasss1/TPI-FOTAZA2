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


    mostrarNotificaciones: async (req, res) => {
        try {
            const usuarioId = req.session.usuario.id;

            // 1. Buscamos todas las notificaciones del usuario
            const notificaciones = await Notificacion.findAll({
                where: { usuario_id: usuarioId },
                include: [{
                    model: Usuario,
                    as: 'actor',
                    attributes: ['username', 'id']
                }],
                order: [['createdAt', 'DESC']] // Las más nuevas primero
            });

            // 2. Renderizamos la vista pasando los datos
            res.render('notificaciones', {
                titulo: 'Mis Notificaciones',
                notificaciones
            });

            // 3. Opcional: Marcar como leídas automáticamente tras verlas
            // (Asegúrate de tener un campo booleano 'leida' en tu modelo Notificacion)
            await Notificacion.update(
                { leida: true },
                { where: { usuario_id: usuarioId, leida: false } }
            );

        } catch (error) {
            console.error("Error al cargar notificaciones:", error);
            res.status(500).send("Error interno al cargar la bandeja");
        }
    },


marcarNotificacionLeida: async (req, res) => {
    try {
        const idNotificacion = req.params.id;
        await Notificacion.update(
            { leida: true },
            { where: { id: idNotificacion, usuario_id: req.session.usuario.id } },
        );
        res.redirect("/notificaciones");
    } catch (error) {
        console.error("Error al marcar como leída:", error);
        res.redirect("/notificaciones");
    }
},

};