// Imports
require('dotenv').config();
const express = require('express');
const path = require('path');
const authRoutes = require('./src/routes/authRoutes');
const postRoutes = require('./src/routes/postRoutes');

const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');

const sequelize = require('./src/config/database'); 

// Iniciar la app y configurar vistas.
const app = express(); 

app.set('view engine','pug');
app.set('views', path.join(__dirname, 'src', 'views'));

// MIDDLEWARES 
app.use(express.urlencoded({extended : true}));
app.use(express.json());

const dbPool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false }
});

app.use(session({
    store: new pgSession({
        pool: dbPool,               
        tableName: 'session',        
        createTableIfMissing: true   
    }),
    secret: process.env.SESSION_SECRET || 'clave_secreta',
    resave: false,
    saveUninitialized: false,        
    cookie: { 
        maxAge: 30 * 24 * 60 * 60 * 1000 
    }
}));

app.use((req, res, next) => {
    res.locals.usuario = req.session.usuario || null;
    next();
});

app.use(express.static(path.join(__dirname, 'src','public')));

// RUTAS
app.use('/', postRoutes);
app.use('/auth', authRoutes);

// MIDDLEWARES RUTAS SUELTAS
const {estaAutenticado, esModerador} = require('./src/middlewares/authMiddleware');

sequelize.sync({ alter: true })
    .then(() => {
        console.log('Tablas sincronizadas con éxito');
    })
    .catch((error) => {
        console.error('Error al sincronizar las tablas:', error);
    });

if (process.env.NODE_ENV !== 'production') {
    const Port = process.env.PORT || 3000; 
    app.listen(Port, () => {
        console.log(`Servidor iniciado en el puerto ${Port}`);
    });
}

module.exports = app;