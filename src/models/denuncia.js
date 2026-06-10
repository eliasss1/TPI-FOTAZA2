const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Denuncia = sequelize.define('Denuncia', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    motivo: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    justificacion: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    resuelta: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'denuncias',
    timestamps: true
});

module.exports = Denuncia;