const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Publicacion = sequelize.define('Publicacion', {
    id: {
        type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        titulo: { type: DataTypes.STRING(150), allowNull: false },
        descripcion: { type: DataTypes.TEXT, allowNull: false},
        bloquear_edicion: { type: DataTypes.BOOLEAN, defaultValue: false },
        bajada: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
    tableName: 'publicaciones',
    timestamps: true,
});

module.exports = Publicacion;