// Imports
require('dotenv').config();
const express = require('express');
const path = require('path');
const authRoutes = require('./src/routes/authRoutes');
const postRoutes = require('./src/routes/postRoutes');
const session = require('express-session');

// Iniciar la app y configurar vistas.
const app = express(); 

app.set('view engine','pug');
app.set('views', path.join(__dirname, 'src', 'views'));

// MIDDLEWARES 
app.use(express.urlencoded({extended : true}));
app.use(express.json())

app.use(session({
    secret: process.env.SESSION_SECRET || 'clave_secreta',
    resave: false,
    saveUninitialized: true
}));

app.use((req, res, next) => {
    res.locals.usuario = req.session.usuario || null;
    next();
});

app.use(express.static(path.join(__dirname, 'src','public')));


// RUTAS
app.use('/', postRoutes);

// Rutas de autenticación
app.use('/auth', authRoutes);

// MIDDLEWARES RUTAS SUELTAS

const {estaAutenticado, esModerador} = require('./src/middlewares/authMiddleware');

// Iniciar el servidor


const Port = process.env.Port || 3000;
sequelize.sync({ alter: true })
    .then(() => {
    console.log('Tablas sincronizadas con éxito');
    })
    .catch((error) => {
    console.error('Error al sincronizar las tablas:', error);
    });

app.listen(Port, () => {
    console.log(`Servidor iniciado en el puerto ${Port}`);
});