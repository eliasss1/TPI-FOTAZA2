const estaAutenticado = (req, res, next) => {
    if (req.session && req.session.usuario) {
        return next();
    }
    res.redirect('/auth/login');
};

const esModerador = (req, res, next) => { 
        
        if (req.session.usuario && req.session.usuario.rol === 'validador') {
            return next(); 
        }                
        console.log('Intento de acceso no autorizado a moderación de:', req.session.usuario);
        res.redirect('/'); 
    }

module.exports = {estaAutenticado, esModerador};