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

    crearComentario: async (req, res) => {
        try {
            const publicacion_id = req.params.id;
            const { comentario } = req.body;

            const imagen = await Imagen.findOne({ where: { publicacion_id: publicacion_id } });
            if (imagen && imagen.comentarios_abiertos === false) {
                return res.status(403).send("Los comentarios están cerrados para esta publicación.");
            }

            await Comentario.create({
                texto: comentario,
                usuario_id: req.session.usuario.id,
                publicacion_id: publicacion_id
            });


            const publicacion = await Publicacion.findByPk(publicacion_id);

            if (publicacion && publicacion.usuario_id !== req.session.usuario.id) {
                await Notificacion.create({
                    tipo_evento: 'comentario',
                    mensaje: `Ha comentado en tu publicacion "${publicacion.titulo}"`,
                    usuario_id: publicacion.usuario_id,
                    actor_id: req.session.usuario.id,
                    publicacion_id: publicacion_id
                });
            }

            res.redirect(req.get('Referrer') || '/');
        } catch (error) {
            console.error("Error al comentar:", error);
            res.status(500).send("Error interno");
        }
    },

    crearDenuncia: async (req, res) => {
        try {
            const publicacionId = req.params.id;
            const usuarioId = req.session.usuario.id;
            const { motivo, justificacion } = req.body;

            const { Denuncia, Publicacion } = require("../models");

            
            const publicacion = await Publicacion.findByPk(publicacionId);
            if (!publicacion || publicacion.usuario_id === usuarioId) {
                console.log("No puedes denunciar tu propia publicación.");
                return res.redirect("/");
            }

            const denunciaExistente = await Denuncia.findOne({
                where: { publicacion_id: publicacionId, usuario_id: usuarioId },
            });
            if (denunciaExistente) {
                console.log("El usuario ya denuncio esta publicacion.");
                return res.redirect("/");
            }

            await Denuncia.create({
                motivo: motivo,
                justificacion: justificacion,
                publicacion_id: publicacionId,
                usuario_id: usuarioId,
            });

            await Publicacion.update(
                { bloquear_edicion: true },
                { where: { id: publicacionId } },
            );

            console.log(`Publicación ${publicacionId} denunciada con éxito.`);
            res.redirect("/");
        } catch (error) {
            console.error("Error al crear la denuncia:", error);
            res.status(500).send("Error interno al procesar la denuncia");
        }
    },

    crearColeccionYGuardar: async (req, res) => {

        try {
            const idPublicacion = req.params.id;
            const nombreColeccion = req.body.nombreColeccion;
            const idUsuario = req.session.usuario.id;


            const [coleccion] = await Coleccion.findOrCreate({
                where: { nombre: nombreColeccion, usuario_id: idUsuario }
            });


            const publicacion = await Publicacion.findByPk(idPublicacion);


            if (publicacion) {
                await coleccion.addPublicacione(publicacion);
            }

            res.redirect('/');

        } catch (error) {
            console.error(error);
            res.redirect('/');
        }
    },

    guardarEnMultiples: async (req, res) => {
        try {
            const publicacion_id = req.params.id;
            let coleccionesIds = req.body.coleccionesOpciones;

            if (!coleccionesIds) {
                return res.redirect('/');
            }

            
            if (!Array.isArray(coleccionesIds)) {
                coleccionesIds = [coleccionesIds];
            }

            const { Publicacion, Coleccion } = require('../models');
            const publicacion = await Publicacion.findByPk(publicacion_id);

            if (!publicacion) return res.redirect('/');

            const colecciones = await Coleccion.findAll({
                where: {
                    id: coleccionesIds,
                    usuario_id: req.session.usuario.id
                }
            });

            for (let col of colecciones) {
                await col.addPublicacione(publicacion);
            }

            res.redirect('/');
        } catch (error) {
            console.error("Error al guardar en multiples colecciones:", error);
            res.status(500).send("Error interno");
        }
    },

    buscarPublicaciones: async (req, res) => {
        try {
            const query = req.query.query || '';
            const licencia = req.query.licencia || '';
            const orden = req.query.orden || 'recientes';
            const etiqueta = req.query.etiqueta || '';

            let wherePublicacion = {
                bajada: { [Op.not]: true }
            };

            if (query) {
                wherePublicacion[Op.or] = [
                    { titulo: { [Op.iLike]: `%${query}%` } },
                    { descripcion: { [Op.iLike]: `%${query}%` } }
                ];
            }
            let whereImagen = {};
            if (!req.session.usuario) {
                whereImagen.tipo_licencia = 'sin_copyright';
            } else if (licencia) {
                whereImagen.tipo_licencia = licencia;
            }
            let includeEtiquetas = { model: Etiqueta, as: "etiquetas" };
            if (etiqueta) {
                includeEtiquetas.where = { nombre: { [Op.iLike]: `%${etiqueta.trim()}%` } };
                includeEtiquetas.required = true;
            }

            let orderRules = [["createdAt", "DESC"]];
            if (orden === "antiguas") {
                orderRules = [["createdAt", "ASC"]];
            }

            const publicaciones = await Publicacion.findAll({
                where: wherePublicacion,
                include: [
                    { model: Usuario, as: "autor", attributes: ["username"] },
                    {
                        model: Imagen,
                        as: "imagenes",
                        where: Object.keys(whereImagen).length > 0 ? whereImagen : undefined,
                        required: Object.keys(whereImagen).length > 0
                    },
                    {
                        model: Comentario,
                        as: "comentarios",
                        include: [{ model: Usuario, as: "autor" }],
                    },
                    includeEtiquetas
                ],
                order: orderRules,
            });

            for (let pub of publicaciones) {
                const votos = await Valoracion.findAll({ where: { publicacion_id: pub.id } });
                pub.dataValues.cantidadVotos = votos.length;
                pub.dataValues.promedioValoracion = votos.length > 0
                    ? (votos.reduce((acc, v) => acc + v.puntos, 0) / votos.length).toFixed(1)
                    : "0.0";
            }

            let misColecciones = [];
            if (req.session.usuario) {
                
                misColecciones = await Coleccion.findAll({
                    where: { usuario_id: req.session.usuario.id }
                });
            }

            
            res.render("index", {
                titulo: "Resultados de busqueda",
                publicaciones,
                misColecciones 
            });
        } catch (error) {
            console.error(error);
            res.status(500).send("Error interno");
        }
    },

    valorarPublicacion: async (req, res) => {
        try {
            const publicacion_id = req.params.id;
            const usuario_id = req.session.usuario.id;
            const { puntos } = req.body;

            const pub = await Publicacion.findByPk(publicacion_id);
            if (!pub || pub.usuario_id === usuario_id) {
                return res.redirect('/');
            }

            const existe = await Valoracion.findOne({ where: { publicacion_id, usuario_id } });
            if (existe) {
                await existe.update({ puntos: parseInt(puntos) });
            } else {
                await Valoracion.create({ puntos: parseInt(puntos), usuario_id, publicacion_id });
                await Notificacion.create({
                    tipo_evento: "valoracion",
                    mensaje: "Ha valorado tu publicacion.",
                    usuario_id: pub.usuario_id,
                    actor_id: usuario_id,
                    publicacion_id: publicacion_id
                });
            }

            res.redirect(req.get("Referrer") || "/");
        } catch (error) {
            console.error(error);
            res.status(500).send("Error al procesar valoracion");
        }
    },

    registrarInteres: async (req, res) => {
        try {
            const publicacion_id = req.params.id;
            const interesado_id = req.session.usuario.id;

            const publicacion = await Publicacion.findByPk(publicacion_id);
            if (!publicacion) return res.redirect('/');

            await Notificacion.create({
                tipo_evento: 'interes',
                mensaje: `esta interesado en adquirir tu imagen titulada "${publicacion.titulo}"`,
                usuario_id: publicacion.usuario_id,
                actor_id: interesado_id
            });
            res.redirect(`/chat/${publicacion.usuario_id}`);
        } catch (error) {
            console.error("Error al registrar interes:", error);
            res.status(500).send("Error interno");
        }
    },

    denunciarComentario: async (req, res) => {
        try {
            const comentarioId = req.params.id;
            const comentario = await Comentario.findByPk(comentarioId);
            
            if (!comentario) return res.status(404).send("Comentario no encontrado");

            const publicacion = await Publicacion.findByPk(comentario.publicacion_id);

            if (publicacion.usuario_id === req.session.usuario.id || comentario.usuario_id === req.session.usuario.id) {
                return res.redirect(req.get('Referrer') || '/');
            }


            await Notificacion.create({
                tipo_evento: 'denuncia_comentario',
                mensaje: `Han denunciado un comentario inapropiado en tu publicación "${publicacion.titulo}".`,
                usuario_id: publicacion.usuario_id,
                actor_id: req.session.usuario.id, // El que denunció
                publicacion_id: publicacion.id,
                comentario_id: comentario.id
            });

            res.redirect(req.get('Referrer') || '/');
        } catch (error) {
            console.error("Error al denunciar comentario:", error);
            res.status(500).send("Error interno");
        }
    },

    borrarComentario: async (req, res) => {
        try {
            const comentarioId = req.params.id;
            const comentario = await Comentario.findByPk(comentarioId);
            if (!comentario) return res.redirect('back');

            const publicacion = await Publicacion.findByPk(comentario.publicacion_id);
            
            if (publicacion.usuario_id === req.session.usuario.id) {
                await comentario.destroy();
            }

            res.redirect(req.get('Referrer') || '/');
        } catch (error) {
            console.error("Error al borrar comentario:", error);
            res.status(500).send("Error interno");
        }
    }


};


