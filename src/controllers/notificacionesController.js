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
            const notificaciones = await Notificacion.findAll({
                where: { usuario_id: usuarioId },
                include: [
                    {
                        model: Usuario,
                        as: "actor",
                    },
                ],
                order: [["createdAt", "DESC"]],
            });
            res.render("notificaciones", {
                titulo: "Mis Notificaciones",
                notificaciones,
            });
        } catch (error) {
            console.error("Error al cargar notificaciones:", error);
            res.status(500).send("Error interno del servidor");
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