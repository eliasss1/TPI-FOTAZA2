const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Valoracion = sequelize.define('Valoracion', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    puntos: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 5
        }
    }
}, {
    tableName: 'valoraciones',
    timestamps: true
});

module.exports = Valoracion;