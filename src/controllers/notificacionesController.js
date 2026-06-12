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

    mostrarPublicacionUnica: async (req, res) => {
        try {
            const id = req.params.id;
            const publicacion = await Publicacion.findByPk(id, {
                include: [
                    { model: Usuario, as: "autor", attributes: ["username"] },
                    { model: Imagen, as: "imagenes" },
                    { model: Etiqueta, as: "etiquetas" },
                    {
                        model: Comentario,
                        as: "comentarios",
                        include: [{ model: Usuario, as: "autor" }],
                    },
                ]
            });

            if (!publicacion || publicacion.bajada) {
                return res.redirect('/');
            }

            const votos = await Valoracion.findAll({ where: { publicacion_id: publicacion.id } });
            publicacion.dataValues.cantidadVotos = votos.length;
            publicacion.dataValues.promedioValoracion = votos.length > 0 
                ? (votos.reduce((acc, v) => acc + v.puntos, 0) / votos.length).toFixed(1) 
                : "0.0";

            let misColecciones = [];
            if (req.session.usuario) {
                misColecciones = await Coleccion.findAll({
                    where: { usuario_id: req.session.usuario.id }
                });
            }

            res.render("index", {
                titulo: "Publicacion",
                publicaciones: [publicacion],
                misColecciones
            });
        } catch (error) {
            console.error(error);
            res.status(500).send("Error interno");
        }
    }

};