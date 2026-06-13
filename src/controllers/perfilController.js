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

    mostrarPerfil: async (req, res) => {
        try {
            const usuarioId = req.params.id ? parseInt(req.params.id) : req.session.usuario.id;
            const esPropioPerfil = usuarioId === req.session.usuario.id;

            const { Usuario, Publicacion, Imagen, Comentario, Valoracion } = require("../models");
            const { Op } = require("sequelize");

            const usuarioPerfil = await Usuario.findByPk(usuarioId, {
                include: [
                    { model: Usuario, as: "Seguidos" },
                    { model: Usuario, as: "Seguidor" },
                ],
            });

            if (!usuarioPerfil) {
                return res.redirect("/");
            }

            const publicaciones = await Publicacion.findAll({
                where: {
                    usuario_id: usuarioId,
                    bajada: { [Op.not]: true }
                },
                include: [
                    { model: Imagen, as: "imagenes" },
                    {
                        model: Comentario,
                        as: "comentarios",
                        include: [{ model: Usuario, as: "autor" }],
                    },
                    { model: Usuario, as: "autor" },
                ],
                order: [["createdAt", "DESC"]],
            });

            for (let pub of publicaciones) {
                const votos = await Valoracion.findAll({ where: { publicacion_id: pub.id } });
                pub.dataValues.cantidadVotos = votos.length;
                pub.dataValues.promedioValoracion = votos.length > 0
                    ? (votos.reduce((acc, v) => v.puntos, 0) / votos.length).toFixed(1)
                    : "0.0";
            }

            const cantidadSeguidores = usuarioPerfil.Seguidor ? usuarioPerfil.Seguidor.length : 0;
            const cantidadSeguidos = usuarioPerfil.Seguidos ? usuarioPerfil.Seguidos.length : 0;

            let yaLoSigue = false;
            if (!esPropioPerfil && req.session.usuario) {
                yaLoSigue = usuarioPerfil.Seguidor?.some(
                    (seguidor) => seguidor.id == req.session.usuario.id,
                ) || false;
            }
            let misColecciones = [];
            if (req.session.usuario) {
                misColecciones = await Coleccion.findAll({
                    where: { usuario_id: req.session.usuario.id }
                });
            }

            const idsSeguidos = usuarioPerfil.Seguidos ? usuarioPerfil.Seguidos.map(u => u.id) : [];

            const publicacionesSeguidos = await Publicacion.findAll({
                    where: {
                        usuario_id: idsSeguidos,
                        bajada: { [Op.not]: true }
                    },
                    include: [
                        { model: Usuario, as: "autor", attributes: ["username"] },
                        { model: Imagen, as: "imagenes", required: true },
                        { model: Etiqueta, as: "etiquetas" },
                        { 
                            model: Comentario, 
                            as: "comentarios", 
                            include: [{ model: Usuario, as: "autor" }] 
                        },
                    ],
                    order: [["createdAt", "DESC"]]
                });

                // 👇 AGREGA ESTE BUCLE AQUÍ 👇
                for (let pub of publicacionesSeguidos) {
                    const votos = await Valoracion.findAll({ where: { publicacion_id: pub.id } });
                    pub.dataValues.cantidadVotos = votos.length;
                    pub.dataValues.promedioValoracion = votos.length > 0
                        ? (votos.reduce((acc, v) => acc + v.puntos, 0) / votos.length).toFixed(1)
                        : "0.0";
                }

            res.render("perfil", {
                titulo: `Perfil de ${usuarioPerfil.username}`,
                publicaciones,
                esPropioPerfil,
                cantidadSeguidores,
                cantidadSeguidos,
                usuarioPerfil,
                yaLoSigue,
                publicacionesSeguidos,
                misColecciones
            });
        } catch (error) {
            console.error("Error al cargar los datos del perfil:", error);
            res.status(500).send("Error interno del servidor");
        }
    },

    seguirUsuario: async (req, res) => {
        try {
            const seguidor_id = req.session.usuario.id;
            const seguido_id = parseInt(req.params.id);

            if (seguidor_id === seguido_id) {
                return res.status(400).send("No puedes seguirte a ti mismo.");
            }

            const usuarioLogueado = await Usuario.findByPk(seguidor_id);
            const usuarioASeguir = await Usuario.findByPk(seguido_id);

            if (!usuarioLogueado || !usuarioASeguir) res.redirect('/');

            const yaLoSigue = await usuarioLogueado.hasSeguidos(usuarioASeguir);

            if (yaLoSigue) {
                await usuarioLogueado.removeSeguidos(usuarioASeguir);
            } else {
                await usuarioLogueado.addSeguidos(usuarioASeguir);

                await Notificacion.create({
                    tipo_evento: 'seguimiento',
                    mensaje: 'Ha comenzado a seguirte.',
                    usuario_id: seguido_id,
                    actor_id: seguidor_id
                });
            }
            res.redirect(`/perfil/${seguido_id}`);
        } catch (error) {
            console.error("Error al seguir usuario:", error);
            res.status(500).send("Error interno");
        }
    },

    /*feedSiguiendo: async (req, res) => {
        try {
            const miId = req.session.usuario.id;
            const { Usuario, Publicacion, Imagen, Etiqueta, Comentario, Valoracion, Coleccion } = require("../models");
            const { Op } = require("sequelize");
            
            const miUsuario = await Usuario.findByPk(miId, {
                include: [{ model: Usuario, as: 'Seguidos', attributes: ['id'] }]
            });
            
            let misColecciones = [];
            if (req.session.usuario) {
                misColecciones = await Coleccion.findAll({
                    where: { usuario_id: miId }
                });
            }

            if (idsSeguidos.length === 0) {
                return res.render("index", { 
                    titulo: "Publicaciones de quienes sigues", 
                    publicaciones: [],
                    misColecciones 
                });
            }
            

            for (let pub of publicaciones) {
                const votos = await Valoracion.findAll({ where: { publicacion_id: pub.id } });
                pub.dataValues.cantidadVotos = votos.length;
                pub.dataValues.promedioValoracion = votos.length > 0 
                    ? (votos.reduce((acc, v) => acc + v.puntos, 0) / votos.length).toFixed(1) 
                    : "0.0";
            }

            res.render("index", { 
                titulo: "Publicaciones de quienes sigues", 
                publicaciones,
                misColecciones 
            });

        } catch (error) {
            console.error("Error al cargar feed de seguidos:", error);
            res.status(500).send("Error interno");
        }
    }*/

};