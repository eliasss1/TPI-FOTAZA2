const sequelize = require('../config/database');

// import de  modelos

const Usuario = require('./usuario');
const Publicacion = require('./publicacion');
const Imagen = require('./imagen');
const Comentario = require('./comentario');
const Etiqueta = require('./etiqueta');
const Denuncia = require('./denuncia');
const Notificacion = require('./notificacion');
const Coleccion = require('./coleccion');
const Valoracion = require('./valoracion');
const Chat = require('./chat');
const Mensaje = require('./mensaje');


// asociaciones
//un usuario tiene muchas publicaciones
Usuario.hasMany(Publicacion, {foreignKey: 'usuario_id', as: 'publicaciones'});
Publicacion.belongsTo(Usuario, {foreignKey: 'usuario_id', as:'autor'});

// Un usuario es dueño de muchas colecciones
Usuario.hasMany(Coleccion, { foreignKey: 'usuario_id', as: 'colecciones' });
Coleccion.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'dueño' });

// Relacion MUCHOS A MUCHOS entre Coleccion y Publicacion
Coleccion.belongsToMany(Publicacion, { through: 'coleccion_publicaciones', as: 'publicaciones', foreignKey: 'coleccion_id' });
Publicacion.belongsToMany(Coleccion, { through: 'coleccion_publicaciones', as: 'colecciones', foreignKey: 'publicacion_id' });

// Un usuario RECIBE muchas notificaciones
Usuario.hasMany(Notificacion, { foreignKey: 'usuario_id', as: 'notificaciones' });
Notificacion.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'receptor' });

// Una notificación es PROVOCADA por otro usuario (actor)
Notificacion.belongsTo(Usuario, { foreignKey: 'actor_id', as: 'actor' });

//Una publicacion puede hacer muchas notis, pero una noti pertenece solo a una publi
Publicacion.hasMany(Notificacion, { foreignKey: 'publicacion_id', onDelete: 'CASCADE' });
Notificacion.belongsTo(Publicacion, { foreignKey: 'publicacion_id' });

//una publicacion tiene muchas imagenes (si se borra la publicacion se borran las imagenes)
Publicacion.hasMany(Imagen, {foreignKey: 'publicacion_id', as: 'imagenes', onDelete: 'CASCADE'});
Imagen.belongsTo(Publicacion, {foreignKey: 'publicacion_id'});

//Relacion de los chat
Usuario.hasMany(Chat, { as: 'chatsIniciados', foreignKey: 'usuario1_id' });
Chat.belongsTo(Usuario, { as: 'iniciador', foreignKey: 'usuario1_id' });

Usuario.hasMany(Chat, { as: 'chatsRecibidos', foreignKey: 'usuario2_id' });
Chat.belongsTo(Usuario, { as: 'receptor', foreignKey: 'usuario2_id' });

// Relaciones de Mensaje
Chat.hasMany(Mensaje, { as: 'mensajes', foreignKey: 'chat_id', onDelete: 'CASCADE' });
Mensaje.belongsTo(Chat, { foreignKey: 'chat_id' });

Usuario.hasMany(Mensaje, { foreignKey: 'emisor_id' });
Mensaje.belongsTo(Usuario, { as: 'emisor', foreignKey: 'emisor_id' });

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
Publicacion.belongsToMany(Etiqueta, { through: 'PublicacionEtiquetas', as: 'etiquetas', foreignKey: 'publicacion_id' });
Etiqueta.belongsToMany(Publicacion, { through: 'PublicacionEtiquetas', as: 'publicaciones', foreignKey: 'etiqueta_id' });

// denuncias
Usuario.hasMany(Denuncia, { foreignKey: 'usuario_id', as: 'denuncias_hechas'});
Denuncia.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'denunciante'});

Publicacion.hasMany(Denuncia, { foreignKey: 'publicacion_id', onDelete: 'CASCADE'});
Denuncia.belongsTo(Publicacion, { foreignKey: 'publicacion_id'});

Usuario.hasMany(Valoracion, { foreignKey: 'usuario_id' });
Valoracion.belongsTo(Usuario, { foreignKey: 'usuario_id' });
Publicacion.hasMany(Valoracion, { foreignKey: 'publicacion_id', onDelete: 'CASCADE' });
Valoracion.belongsTo(Publicacion, { foreignKey: 'publicacion_id' });

module.exports = {
    sequelize,
    Usuario,
    Publicacion,
    Imagen,
    Comentario,
    Etiqueta,
    Denuncia,
    Notificacion,
    Coleccion,
    Valoracion,
    Chat,
    Mensaje
};
