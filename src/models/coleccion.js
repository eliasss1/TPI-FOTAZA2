const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Coleccion = sequelize.define('Coleccion', {
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

module.exports = Coleccion;