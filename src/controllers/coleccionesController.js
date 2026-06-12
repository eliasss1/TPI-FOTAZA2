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

    cargarColecciones: async (req, res) => {
        try {
            const usuarioID = req.session.usuario.id;
            const colecciones = await Coleccion.findAll({
                where: {
                    usuario_id: usuarioID,
                },
                include: [
                    {model: Publicacion, as: "publicaciones"},
                ]
            });
            res.render("colecciones", { titulo: "Colecciones", colecciones});

        }catch(error){
            console.error(error)
            res.status(500).send("Error interno");
        }
    },

    mostrarColeccion: async (req, res) => {
        try {
            const coleccionId = req.params.id;
            const coleccion = await Coleccion.findByPk(coleccionId, {
                include: [{
                    model: Publicacion,
                    as: 'publicaciones',
                    where: { bajada: { [Op.not]: true } },
                    required: false,
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
                }]
            });

            if (!coleccion) {
                return res.redirect('/colecciones');
            }

            const publicaciones = coleccion.publicaciones || [];

            for (let pub of publicaciones) {
                const votos = await Valoracion.findAll({ where: { publicacion_id: pub.id } });
                pub.dataValues.cantidadVotos = votos.length;
                pub.dataValues.promedioValoracion = votos.length > 0 
                    ? (votos.reduce((acc, v) => acc + v.puntos, 0) / votos.length).toFixed(1) 
                    : "0.0";
            }

            res.render("index", {
                titulo: `Coleccion: ${coleccion.nombre}`,
                publicaciones
            });
        } catch (error) {
            console.error(error);
            res.status(500).send("Error interno");
        }
    }

};