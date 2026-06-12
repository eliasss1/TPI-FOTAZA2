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


    mostrarModeracion: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = 5; // Cantidad de denuncias por página
            const offset = (page - 1) * limit;

            const { Denuncia, Publicacion, Usuario } = require("../models");
            const sequelize = require("../config/database");

            const publicacionesComprometidas = await Denuncia.findAll({
                attributes: ["publicacion_id"],
                where: { resuelta: false },
                group: ["publicacion_id"],
                having: sequelize.literal("COUNT(DISTINCT usuario_id) > 0"), 
            });

            const idsPublicaciones = publicacionesComprometidas.map(
                (d) => d.publicacion_id,
            );

            if (idsPublicaciones.length === 0) {
                return res.render("moderacion", {
                    titulo: "Gestión de Denuncias y Moderación",
                    listaDenuncias: [],
                    paginaActual: page,
                    totalPaginas: 0,
                });
            }

            const totalDenuncias = await Denuncia.count({
                where: {
                    resuelta: false,
                    publicacion_id: idsPublicaciones,
                },
            });

            const denunciasBD = await Denuncia.findAll({
                where: {
                    resuelta: false,
                    publicacion_id: idsPublicaciones,
                },
                include: [
                    {
                        model: Publicacion,
                        include: [
                            { model: Usuario, as: "autor", attributes: ["username"] },
                        ],
                    },
                ],
                limit: limit,
                offset: offset,
                order: [["createdAt", "DESC"]],
            });

            const listaDenuncias = denunciasBD.map((d) => {
                return {
                    id: d.id,
                    publicacion_id: d.publicacion_id,
                    motivo: d.motivo,
                    justificacion: d.justificacion,
                    titulo: d.Publicacion
                        ? d.Publicacion.titulo
                        : "Publicación sin título",
                    autor: {
                        username:
                            d.Publicacion && d.Publicacion.autor
                                ? d.Publicacion.autor.username
                                : "anónimo",
                    },
                };
            });

            const totalPaginas = Math.ceil(totalDenuncias / limit);

            res.render("moderacion", {
                titulo: "Gestión de Denuncias y Moderación",
                listaDenuncias,
                paginaActual: page,
                totalPaginas,
            });
        } catch (error) {
            console.error("Error al cargar el panel de moderación:", error);
            res.status(500).send("Error interno del servidor al cargar moderación");
        }
    },
    rechazarDenuncia: async (req, res) => {
        try {
            const idDenuncia = req.params.id;
            const { Denuncia } = require("../models");

            const denuncia = await Denuncia.findByPk(idDenuncia);
            if (!denuncia) return res.redirect("/moderacion");

            await Denuncia.update(
                { resuelta: true },
                { where: { id: idDenuncia } } 
            );

            console.log(
                `Denuncias para la publicación ${denuncia.publicacion_id} desestimadas.`,
            );
            res.redirect("/moderacion");
        } catch (error) {
            console.error("Error al desestimar la denuncia:", error);
            res.status(500).send("Error interno al procesar la acción");
        }
    },

    aceptarDenuncia: async (req, res) => {
        try {
            const idDenuncia = req.params.id;
            const moderadorId = req.session.usuario.id; 
            
            
            const { Denuncia, Publicacion, Usuario, Notificacion } = require("../models"); 
            
            const denuncia = await Denuncia.findByPk(idDenuncia);
            if (!denuncia) return res.redirect("/moderacion");
            
            const publicacionId = denuncia.publicacion_id;
            const publicacion = await Publicacion.findByPk(publicacionId);

            if (publicacion) {
                const autorId = publicacion.usuario_id || publicacion.UsuarioId;


                await Publicacion.update(
                    { bajada: true },
                    { where: { id: publicacionId } },
                );
                console.log(`Publicación ${publicacionId} dada de baja exitosamente.`);


                await Notificacion.create({
                    tipo_evento: 'moderacion',
                    mensaje: 'Tu publicación ha sido eliminada por infringir las normas de la comunidad.',
                    usuario_id: autorId,
                    actor_id: moderadorId
                });


                const cantidadBajas = await Publicacion.count({
                    where: {
                        [publicacion.usuario_id ? "usuario_id" : "UsuarioId"]: autorId,
                        bajada: true,
                    },
                });

                if (cantidadBajas >= 3) {
                    await Usuario.update({ activo: false }, { where: { id: autorId } });
                    console.log(`El usuario ${autorId} alcanzó las 3 bajas. Cuenta inactivada.`);
                    

                    await Notificacion.create({
                        tipo_evento: 'sancion',
                        mensaje: 'Tu cuenta ha sido suspendida permanentemente por acumular 3 infracciones.',
                        usuario_id: autorId,
                        actor_id: moderadorId
                    });
                } else if (cantidadBajas === 2) {

                    await Notificacion.create({
                        tipo_evento: 'advertencia',
                        mensaje: 'Atención: Tienes 2 publicaciones eliminadas. Una infracción más y tu cuenta será suspendida.',
                        usuario_id: autorId,
                        actor_id: moderadorId
                    });
                }
            }

            await Denuncia.update(
                { resuelta: true },
                { where: { publicacion_id: publicacionId } },
            );

            res.redirect("/moderacion");
        } catch (error) {
            console.error("Error al aceptar la denuncia y aplicar sanciones:", error);
            res.status(500).send("Error interno al procesar la baja");
        }
    },
};