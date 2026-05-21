// exportar funciones
module.exports = {
    mostrarLogin: (req, res) => {
        res.render('login', { titulo: 'Iniciar Sesion'});

    },
    // Procesar el login
    procesarLogin: (req, res) => {
        const { username, password } = req.body;
        
        console.log(`Intentando loguear a: ${email}`);

        res.redirect('/');
}
};