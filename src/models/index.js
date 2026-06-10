const sequelize = require('../config/database');

// import de  modelos

const Usuario = require('./usuario');
const Publicacion = require('./publicacion');
const Imagen = require('./imagen');
const Comentario = require('./comentario');
const Etiqueta = require('./etiqueta');
const Denuncia = require('./denuncia');
const Notificacion = require('./notificacion');


// asociaciones
//un usuario tiene muchas publicaciones
Usuario.hasMany(Publicacion, {foreignKey: 'usuario_id', as: 'publicaciones'});
Publicacion.belongsTo(Usuario, {foreignKey: 'usuario_id', as:'autor'});

// Un usuario RECIBE muchas notificaciones
Usuario.hasMany(Notificacion, { foreignKey: 'usuario_id', as: 'notificaciones' });
Notificacion.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'receptor' });

// Una notificación es PROVOCADA por otro usuario (actor)
Notificacion.belongsTo(Usuario, { foreignKey: 'actor_id', as: 'actor' });

//una publicacion tiene muchas imagenes (si se borra la publicacion se borran las imagenes)
Publicacion.hasMany(Imagen, {foreignKey: 'publicacion_id', as: 'imagenes', onDelete: 'CASCADE'});
Imagen.belongsTo(Publicacion, {foreignKey: 'publicacion_id'});

//relacion de seguidores
Usuario.belongsToMany(Usuario, {
    through: 'seguidores',
    as: 'Seguidos',
    foreignKey: 'seguidor_id',
    otherKey: 'seguido_id'
});
Usuario.belongsToMany(Usuario, {
    through: 'seguidores',
    as: 'Seguidor',
    foreignKey: 'seguido_id',
    otherKey: 'seguidor_id',
});

// comentario (un usuario hace muchos comentarios, una publicacion tiene muchos comentarios)
Usuario.hasMany(Comentario, { foreignKey: 'usuario_id'});
Comentario.belongsTo( Usuario, { foreignKey: 'usuario_id', as: 'autor'});

Publicacion.hasMany(Comentario, { foreignKey: 'publicacion_id', as: 'comentarios', onDelete: 'CASCADE' });
Comentario.belongsTo(Publicacion, { foreignKey: 'publicacion_id' });

// etiquetas
Publicacion.belongsToMany(Etiqueta, { through: 'publicacion_etiquetas', foreignKey: 'publicacion_id'});
Etiqueta.belongsToMany(Publicacion, { through: 'publicacion_etiquetas', foreignKey: 'etiqueta_id'});

// denuncias
Usuario.hasMany(Denuncia, { foreignKey: 'usuario_id', as: 'denuncias_hechas'});
Denuncia.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'denunciante'});

Publicacion.hasMany(Denuncia, { foreignKey: 'publicacion_id', onDelete: 'CASCADE'});
Denuncia.belongsTo(Publicacion, { foreignKey: 'publicacion_id'});

module.exports = {
    sequelize,
    Usuario,
    Publicacion,
    Imagen,
    Comentario,
    Etiqueta,
    Denuncia,
    Notificacion
};
