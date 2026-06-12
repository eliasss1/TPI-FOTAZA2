const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Imagen = sequelize.define('Imagen', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    url_path: {type: DataTypes.TEXT, allowNull: false},
    tipo_licencia: { type: DataTypes.ENUM('con_copyright', 'sin_copyright'), allowNull: false },
    marca_agua: { type: DataTypes.STRING(100), allowNull: true },
    comentarios_abiertos: { type: DataTypes.BOOLEAN, defaultValue: true}
}, {
    tableName: 'imagenes',
    timestamps: false
});

module.exports = Imagen;