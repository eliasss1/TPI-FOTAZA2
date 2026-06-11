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
            const publicaciones = await Publicacion.findAll({
                where: {
                    bajada: {
                        [Op.not]: true,
                    },
                },
                include: [
                    { model: Usuario, as: "autor", attributes: ["username"] },
                    { model: Imagen, as: "imagenes" },
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

            res.render("index", 
            {   titulo: "Feed Fotaza", 
                publicaciones,
            });
        } catch (error) {
            console.error("Error al cargar el feed:", error);
            res.status(500).send("Error interno");
        }
    },

    mostrarFormulario: (req, res) => {
        if (!req.session.usuario) return res.redirect("/auth/login");
        res.render("nueva-publicacion", { titulo: "Subir foto" });
    },

    crearPublicacion: (req, res) => {
        const formidable = require("formidable");
        const path = require("path");
        const fs = require("fs");

        const uploadDir = path.join(__dirname, "../public/images");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const form = new formidable.IncomingForm({
            uploadDir: uploadDir,
            keepExtensions: true,
            multiples: true,
        });

        form.parse(req, async (err, fields, files) => {
            if (err) return res.status(500).send("Error al procesar el formulario");
            
            try {
                const titulo = Array.isArray(fields.titulo) ? fields.titulo[0] : fields.titulo;
                const descripcion = Array.isArray(fields.descripcion) ? fields.descripcion[0] : fields.descripcion;
                const tipo_licencia = Array.isArray(fields.tipo_licencia) ? fields.tipo_licencia[0] : fields.tipo_licencia;
                const marca_agua = Array.isArray(fields.marca_agua) ? fields.marca_agua[0] : fields.marca_agua;
                const etiquetas = Array.isArray(fields.etiquetas) ? fields.etiquetas[0] : fields.etiquetas;

                const nuevaPub = await Publicacion.create({
                    titulo,
                    descripcion,
                    usuario_id: req.session.usuario.id,
                });

                let imagenesSubidas = files.imagenes;
                if (!Array.isArray(imagenesSubidas)) imagenesSubidas = [imagenesSubidas];

                for (let img of imagenesSubidas) {
                    if (img && img.newFilename) {
                        await Imagen.create({
                            url_path: "/images/" + img.newFilename,
                            tipo_licencia: tipo_licencia || "con_copyright",
                            marca_agua: marca_agua || null,
                            publicacion_id: nuevaPub.id,
                        });
                    }
                }
                if (etiquetas) {
                    const listaEtiquetas = etiquetas.split(',')
                        .map(e => e.trim().toLowerCase())
                        .filter(e => e.length > 0);

                    for (let nombre of listaEtiquetas) {
                        const [etiquetaInstancia] = await Etiqueta.findOrCreate({
                            where: { nombre }
                        });
                        await nuevaPub.addEtiqueta(etiquetaInstancia);
                    }
                }

                res.redirect("/");
            } catch (error) {
                console.error("Error DB:", error);
                res.status(500).send("Error al guardar en la base de datos");
            }
        });
    },

    mostrarPerfil: async (req, res) => {
        try {
            const usuarioId = req.params.id ? req.params.id : req.session.usuario.id;
            const esPropioPerfil = usuarioId == req.session.usuario.id;

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
                where: { usuario_id: usuarioId },
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

            //Le cargo los seguidores
            const cantidadSeguidores = usuarioPerfil.Seguidor
                ? usuarioPerfil.Seguidor.length
                : 0;
            const cantidadSeguidos = usuarioPerfil.Seguidos
                ? usuarioPerfil.Seguidos.length
                : 0;

            //Verifico si ya lo sigue
            let yaLoSigue = false;
            if (!esPropioPerfil) {
                yaLoSigue =
                    usuarioPerfil.Seguidor?.some(
                        (seguidor) => seguidor.id === req.session.usuario.id,
                    ) || false;
            }

            res.render("perfil", {
                titulo: `Perfil de ${usuarioPerfil.username}`,
                publicaciones,
                esPropioPerfil,
                cantidadSeguidores,
                cantidadSeguidos,
                usuarioPerfil,
                yaLoSigue,
                publicacionesSeguidos: [],
            });
        } catch (error) {
            console.error("Error al cargar los datos del perfil:", error);
            res.status(500).send("Error interno del servidor");
        }
    },

    crearComentario: async (req, res) => {
        try {
            const idPublicacion = req.params.id;
            const idUsuario = req.session.usuario.id;
            const textoContenido = req.body.comentario;

            await Comentario.create({
                texto: textoContenido,
                usuario_id: idUsuario,
                publicacion_id: idPublicacion,
            });

            const publicacion = await Publicacion.findByPk(idPublicacion);

            if (publicacion && publicacion.usuario_id !== idUsuario) {
                await Notificacion.create({
                    tipo_evento: "comentario",
                    mensaje: "Ha comentado en tu publicación.",
                    usuario_id: publicacion.usuario_id,
                    actor_id: idUsuario,
                });
            }

            res.redirect(req.get("Referrer") || "/");
        } catch (error) {
            console.error("No se ha podido publicar el comentario", error);
            res.status(500).send("Ha habido un error al cargar tu comentario");
        }
    },

    crearDenuncia: async (req, res) => {
        try {
            const publicacionId = req.params.id;
            const usuarioId = req.session.usuario.id;
            const { motivo, justificacion } = req.body;

            const { Denuncia, Publicacion } = require("../models");
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

            console.log(`Publicaion ${publicacionId} denunciada con exito.`);
            res.redirect("/");
        } catch (error) {
            console.error("Error al crear la denuncia:", error);
            res.status(500).send("Error interno al procesar la denuncia");
        }
    },

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
                having: sequelize.literal("COUNT(id) >= 3"),
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
            const { Denuncia, Publicacion, Usuario } = require("../models");
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

                const cantidadBajas = await Publicacion.count({
                    where: {
                        [publicacion.usuario_id ? "usuario_id" : "UsuarioId"]: autorId,
                        bajada: true,
                    },
                });

                if (cantidadBajas >= 3) {
                    await Usuario.update({ activo: false }, { where: { id: autorId } });
                    console.log(
                        `⚠️ El usuario ${autorId} alcanzó las 3 bajas. Cuenta inactivada.`,
                    );
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

    //DESDE ACA METO TODOS LOS METODOS DE COLECCIONES xd

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
    },

    buscarPublicaciones: async (req, res) => {
        try {
            const query = req.query.query || '';
            const publicaciones = await Publicacion.findAll({
                where: {
                    bajada: { [Op.not]: true },
                    [Op.or]: [
                        { titulo: { [Op.iLike]: `%${query}%` } },
                        { descripcion: { [Op.iLike]: `%${query}%` } }
                    ]
                },
                include: [
                    { model: Usuario, as: "autor", attributes: ["username"] },
                    { model: Imagen, as: "imagenes" },
                    {
                        model: Comentario,
                        as: "comentarios",
                        include: [{ model: Usuario, as: "autor" }],
                    },
                    { model: Etiqueta, as: "etiquetas" },
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

            res.render("index", { titulo: "Resultados de busqueda", publicaciones });
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
                });
            }

            res.redirect(req.get("Referrer") || "/");
        } catch (error) {
            console.error(error);
            res.status(500).send("Error al procesar valoracion");
        }
    }

};
