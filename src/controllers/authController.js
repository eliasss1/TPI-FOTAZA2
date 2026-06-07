// exportar funciones
const bcrypt = require('bcrypt');
const Usuario = require('../models/usuario');
module.exports = {

    logout: (req, res) => {
        req.session.destroy((err) => {
            if (err) console.error("Error al cerrar sesión:", err);
            res.redirect('/');
        });
    },

    mostrarLogin: (req, res) => {
        res.render('login', { titulo: 'Iniciar Sesion'});

    },
    procesarLogin: async (req, res) => {
        const { email, password } = req.body;
        try {
        const usuario = await Usuario.findOne({ where: { email: email } });
        if (!usuario) {
            return res.render('login', { titulo: 'Iniciar Sesion', error: 'Email o contraseña incorrectos' });
        }

        // Verificar que la cuenta esté activa
        if (!usuario.activo) {
            return res.render('login', { titulo: 'Iniciar Sesion', error: 'Tu cuenta está inactiva' });
        }

        // Comparar contraseña
        const passwordOk = await bcrypt.compare(password, usuario.password);
        if (!passwordOk) {
            return res.render('login', { titulo: 'Iniciar Sesion', error: 'Email o contraseña incorrectos' });
        }

        // Guardar en sesión
        req.session.usuario = {
            id: usuario.id,
            username: usuario.username,
            email: usuario.email,
            rol: usuario.rol
        };
        console.log("Sesión guardada:", req.session.usuario);//borrar cuando se resuelva el tema de la sesión
        res.redirect('/');
    } catch (error) {
        console.error('Error en login:', error);
        res.render('login', { titulo: 'Iniciar Sesion', error: 'Ocurrió un error al iniciar sesión' });
    }
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
            // Si no, mostramos un error, es necesario poner el catch para que no se caiga el servidor
        } catch (error) {
            console.error('Error al registrar usuario:', error);
            res.render('registro', { titulo: 'Crear Cuenta', error: 'Ocurrió un error al registrarse' });
        }
    }
};