const { Publicacion, Imagen, Usuario} = require('../models');
const formidable = require('formidable');
const fs = require('fs');
const path = require('path');

module.exports = {
    mostrarFeed: async (req, res) => {
        try {
            const publicaciones = await Publicacion.findAll({
                include: [
                    { model: Usuario, as: 'autor', attributes: ['username']},
                    { model: Imagen, as: 'imagenes'}
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
            const usuarioId = req.session.usuario.id;

            
            const publicaciones = await Publicacion.findAll({
                where: { usuario_id: usuarioId },
                include: [{ model: Imagen, as: 'imagenes' }],
                order: [['createdAt', 'DESC']]
            });

            
            const usuarioDb = await Usuario.findByPk(usuarioId, {
                include: [
                    { model: Usuario, as: 'Seguidos' },
                    { model: Usuario, as: 'Seguidor' }
                ]
            });

            const cantidadSeguidores = usuarioDb?.Seguidor?.length || 0;
            const cantidadSeguidos = usuarioDb?.Seguidos?.length || 0;

        
            res.render('perfil', { 
                titulo: 'Mi Perfil', 
                publicaciones,
                esPropioPerfil: true,
                cantidadSeguidores,
                cantidadSeguidos,
                publicacionesSeguidos: []
            });
        } catch (error) {
            console.error('Error al cargar los datos del perfil:', error);
            res.status(500).send('Error interno del servidor');
        }
    }

};


