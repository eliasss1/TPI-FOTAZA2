const estaAutenticado = (req, res, next) => {
    if (req.session && req.session.usuario) {
        return next();
    }
    res.redirect('/auth/login');
};

const esModerador = (req, res, next) => {
    if (req.session && req.session.usuario && req.session.usuario.rol === 'moderador') {
        res.redirect('/');
    }
}

module.exports = {estaAutenticado, esModerador};