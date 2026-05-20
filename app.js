// Imports
require('dotenv').config();
const express = require('express');
const path = require('path');

// Iniciar la app y configurar vistas.
const app = express(); 

app.set('view engine','pug');
app.set('views', path.join(__dirname, 'src', 'views'));

// MIDDLEWARES 
app.use(express.urlencoded({extended : true}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'src','public')));

// RUTAS
app.get('/', (req, res) => {
    res.render('index', { titulo: 'Bienvenido a Fotaza'});
});

// Iniciar el servidor
const Port = process.env.Port || 3000;
app.listen(Port, () => {
    console.log(`Servidor iniciado en el puerto ${Port}`);
});