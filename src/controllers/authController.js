// exportar funciones
const bcrypt = require('bcrypt');
const Usuario = require('../models/usuario');
module.exports = {
    mostrarLogin: (req, res) => {
        res.render('login', { titulo: 'Iniciar Sesion'});

    },
    // Procesar el login
    procesarLogin: (req, res) => {
        const { username, password } = req.body;       
        console.log(`Intentando loguear a: ${username}`);
        res.redirect('/');        
    },
    mostrarRegistro: (req, res) => {
        res.render('registro', { titulo: 'Crear Cuenta' });
    },
    procesarRegistro: async (req, res) => {
        try {           
            const { username, email, password } = req.body;
            //acá se encripta wachin, se genera un salt y se hashea la contraseña
            const salt = await bcrypt.genSalt(10);
            // Hasheamos la contraseña
            const hashedPassword = await bcrypt.hash(password, salt);
            //aca se guarda en la db
            await Usuario.create({
                username: username,
                email: email,
                password: hashedPassword
                // lo que no esta lo pone el sequalize
            });
            console.log(`Usuario ${username} creado con éxito en la BD.`);           
            // Si todo sale bien, lo mandamos a que inicie sesión
            res.redirect('/auth/login');
            // Si no, mostramos un error, no se si es necesario, pero bueno, por las dudas xd
        } catch (error) {
            console.error('Error al registrar usuario:', error);
            res.render('registro', { titulo: 'Crear Cuenta', error: 'Ocurrió un error al registrarse' });
        }
    }
};