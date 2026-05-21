const {DataTypes} = require('sequelize');
const sequelize = require('../config/database');

const Usuario = sequelize.define('Usuario', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: {msg: "El nombre de usuario no puede estar vacio."}
        }
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate:{
            isEmail: {msg: "Debe ingresar un email valido."}
        }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    rol: {
        type: DataTypes.ENUM('usuario', 'validador'),
        allowNull: false,
        defaultValue: 'usuario'
    },
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {  
        tableName: 'usuarios',
        timestamps: true
    });

    module.exports = Usuario;
