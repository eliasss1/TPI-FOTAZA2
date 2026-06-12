const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notificacion = sequelize.define('Notificacion', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    tipo_evento: {
        // Agregamos 'denuncia_comentario' a la lista
        type: DataTypes.ENUM('comentario', 'valoracion', 'interes', 'seguimiento', 'denuncia_comentario', 'moderacion', 'sancion', 'advertencia'),
        allowNull: false
    },
    mensaje: {
        type: DataTypes.STRING,
        allowNull: false
    },
    leida: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    publicacion_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    comentario_id: { 
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'notificaciones'
});

module.exports = Notificacion;