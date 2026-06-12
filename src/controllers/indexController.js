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

    mostrarFeed: async (req, res) => {
        try {
            const imagenInclude = {
            model: Imagen,
            as: "imagenes"
        };
        if (!req.session.usuario) {
            imagenInclude.where = { tipo_licencia: 'sin_copyright' };
            imagenInclude.required = true; 
        }
        const publicaciones = await Publicacion.findAll({
            where: { bajada: { [Op.not]: true } },
            include: [
                { model: Usuario, as: "autor", attributes: ["username"] },
                imagenInclude,
                { model: Etiqueta, as: "etiquetas" },
                {
                    model: Comentario,
                    as: "comentarios",
                    include: [{ model: Usuario, as: "autor" }],
                },
            ],
            order: [["createdAt", "DESC"]],
        });
            for (let pub of publicaciones) {
                const votos = await Valoracion.findAll({ where: { publicacion_id: pub.id } });
                pub.dataValues.cantidadVotos = votos.length;
                pub.dataValues.promedioValoracion = votos.length > 0 
                    ? (votos.reduce((acc, v) => acc + v.puntos, 0) / votos.length).toFixed(1) 
                    : "0.0";
            }
            // Logica de Balance 
            let destacadas = [];
            let normales = [];

            for (let pub of publicaciones) {
                const promedio = parseFloat(pub.dataValues.promedioValoracion);
                const cantidad = pub.dataValues.cantidadVotos;

                if (promedio >= 4.0 && cantidad >=3) {
                    destacadas.push(pub);
                } else {
                    normales.push(pub);
                }
            }

            destacadas.sort((a, b) => b.dataValues.promedioValoracion - a.dataValues.promedioValoracion);

            let feedBalanceado = [];
            let indexDestacadas = 0;
            let indexNormales = 0;

            while (indexDestacadas < destacadas.length || indexNormales < normales.length){
                if (indexDestacadas < destacadas.length) feedBalanceado.push(destacadas[indexDestacadas++]);
                if (indexDestacadas < destacadas.length) feedBalanceado.push(destacadas[indexDestacadas++]);
                if (indexNormales < normales.length) feedBalanceado.push(normales[indexNormales++]);
            }

            res.render("index", 
            {   titulo: "Feed Fotaza", 
                publicaciones: feedBalanceado,
            });
        } catch (error) {
            console.error("Error al cargar el feed:", error);
            res.status(500).send("Error interno");
        }
    },

    

};