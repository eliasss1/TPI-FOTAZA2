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
                    
                    const comentarios_abiertos = fields.comentarios ? true : false;

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
                                comentarios_abiertos: comentarios_abiertos, // NUEVO: Guardamos la decisión del usuario
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

    cerrarComentarios: async (req, res) => {
        try {
            const publicacion_id = req.params.id;
            const usuario_id = req.params.id;

            const publicacion = await Publicacion.findByPk(publicacion_id);
            if (!publicacion || publicacion.usuario_id !== usuario_id) {
                return res.status(403).send("No autorizado para realizar esta accion.");
            }
            await Imagen.update(
                { comentarios_abiertos: false},
                {where: { publicacion_id}}
            );
            res.redirect('back');
        } catch (error) {
            console.error('Error al cerrar comentarios:', error);
            res.status(500).send("Error interno");
        }
    },

};