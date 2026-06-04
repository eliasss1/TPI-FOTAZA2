const sequelize = require('../config/database');

// import de  modelos

const Usuario = require('./usuario');
const Publicacion = require('./publicacion');
const Imagen = require('./imagen');

// asociaciones
//un usuario tiene muchas publicaciones
Usuario.hasMany(Publicacion, {foreignKey: 'usuario_id', as: 'publicaciones'});
Publicacion.belongsTo(Usuario, {foreignKey: 'usuario_id', as:'autor'});

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

module.exports = {
    sequelize,
    Usuario,
    Publicacion,
    Imagen
};
