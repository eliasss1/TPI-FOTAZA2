const { Publicacion, Imagen, Usuario, Comentario} = require('../models');
const formidable = require('formidable');
const fs = require('fs');
const path = require('path');

module.exports = {
    mostrarFeed: async (req, res) => {
        try {
            const publicaciones = await Publicacion.findAll({
                include: [
                    { model: Usuario, as: 'autor', attributes: ['username']},
                    { model: Imagen, as: 'imagenes'},
                    { model: Comentario, as: 'comentarios',
                        include: [{ model: Usuario, as: 'autor'}]
                    }
                ],
                order: [['createdAt', 'DESC']]
            });
            
            res.render('index', { titulo: 'Feed Fotaza', publicaciones});
        } catch (error) {
            console.error('Error al cargar el feed:', error);
            res.status(500).send('Error interno');
        } 
        
    },

    mostrarFormulario: (req, res) => {
        if (!req.session.usuario) return res.redirect('/auth/login');
        res.render('nueva-publicacion', {titulo: 'Subir foto'});
    },

    crearPublicacion: (req, res) => {
        if(!req.session.usuario) return res.redirect('/auth/login');

        const uploadDir = path.join(__dirname, '../public/images');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true});
        }

        const form = new formidable.IncomingForm({
            uploadDir: uploadDir,
            keepExtensions: true,
            multiples: true
        });

        form.parse(req, async (err, fields, files) => {
            if (err) return res.status(500).send('Error al procesar el formulario');
            try {
                const titulo = Array.isArray(fields.titulo) ? fields.titulo[0] : fields.titulo;
                const descripcion = Array.isArray(fields.descripcion) ? fields.descripcion[0] : fields.descripcion;
                const tipo_licencia = Array.isArray(fields.tipo_licencia) ? fields.tipo_licencia[0] : fields.tipo_licencia;
                const marca_agua = Array.isArray(fields.marca_agua) ? fields.marca_agua[0] : fields.marca_agua;

                const nuevaPub = await Publicacion.create({
                    titulo,
                    descripcion,
                    usuario_id: req.session.usuario.id
                });
                
                let imagenesSubidas = files.imagenes;
                if (!Array.isArray(imagenesSubidas)) imagenesSubidas = [imagenesSubidas];

                for (let img of imagenesSubidas) {
                    if (img && img.newFilename) {
                        await Imagen.create({
                            url_path: '/images/' + img.newFilename,
                            tipo_licencia: tipo_licencia || 'con_copyright',
                            marca_agua: marca_agua || null,
                            publicacion_id: nuevaPub.id
                        });
                    }
                }
                res.redirect('/');
            } catch (error) {
                console.error('Error DB:', error);
                res.status(500).send('Error al guardar en la base de datos');
            }
        });
    },

    mostrarPerfil: async (req, res) => {
        try {

            const usuarioId = req.params.id ? req.params.id : req.session.usuario.id;
            const esPropioPerfil = (usuarioId == req.session.usuario.id);

            const usuarioPerfil = await Usuario.findByPk(usuarioId, {
                include: [
                    { model: Usuario, as: 'Seguidos' },
                    { model: Usuario, as: 'Seguidor' }
                ]
            });

            
            if (!usuarioPerfil) {
                return res.redirect('/');
            }

            const publicaciones = await Publicacion.findAll({
                where: { usuario_id: usuarioId },
                include: [
                    { model: Imagen, as: 'imagenes' },
                    { model: Comentario, as: 'comentarios',
                        include: [{ model: Usuario, as: 'autor'}]
                    },
                    { model: Usuario, as: 'autor' }
                ],
                order: [['createdAt', 'DESC']]
            });
            
            //Le cargo los seguidores
            const cantidadSeguidores = usuarioPerfil.Seguidor ? usuarioPerfil.Seguidor.length : 0;
            const cantidadSeguidos = usuarioPerfil.Seguidos ? usuarioPerfil.Seguidos.length : 0;
            
            //Verifico si ya lo sigue
            let yaLoSigue = false;
            if (!esPropioPerfil) {
                yaLoSigue = usuarioPerfil.Seguidor?.some(seguidor => seguidor.id === req.session.usuario.id) || false;
            }

        
            res.render('perfil', { 
                titulo: `Perfil de ${usuarioPerfil.username}`, 
                publicaciones,
                esPropioPerfil,
                cantidadSeguidores,
                cantidadSeguidos,
                usuarioPerfil,
                yaLoSigue,
                publicacionesSeguidos: []
            });
        } catch (error) {
            console.error('Error al cargar los datos del perfil:', error);
            res.status(500).send('Error interno del servidor');
        }
    },

    crearComentario: async (req, res) => {
        try{
            const idPublicacion = req.params.id; 
            const idUsuario = req.session.usuario.id;
            const textoContenido = req.body.comentario;

            await Comentario.create({
                texto: textoContenido,
                usuario_id: idUsuario,
                publicacion_id: idPublicacion
            });
            
            res.redirect(req.get('Referrer') || '/');

        }catch(error){
            console.error("No se ha podido publicar el comentario", error);
            res.status(500).send("Ha habido un error al cargar tu comentario");
        }
    },

    crearDenuncia: async (req, res) => {
    try {
        const publicacionId = req.params.id;
        const usuarioId = req.session.usuario.id;
        const { motivo, justificacion } = req.body;

        const { Denuncia, Publicacion} = require('../models');
        const denunciaExistente = await Denuncia.findOne({
            where: { publicacion_id: publicacionId, usuario_id: usuarioId}
        });
        if (denunciaExistente) {
            console.log("El usuario ya denuncio esta publicacion.");
            return res.redirect('/');
        }

        await Denuncia.create({
            motivo: motivo,
            justificacion: justificacion,
            publicacion_id: publicacionId,
            usuario_id: usuarioId
        });

        await Publicacion.update(
            {bloquear_edicion: true},
            { where: {id: publicacionId}}
        );

        console.log(`Publicaion ${publicacionId} denunciada con exito.`);
        res.redirect('/');
    } catch (error) {
        console.error("Error al crear la denuncia:", error);
        res.status(500).send("Error interno al procesar la denuncia");
    }
}

};


