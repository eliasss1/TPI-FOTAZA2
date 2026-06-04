const {sequelize} = require('../models/index');

async function iniciarDB() {
    try{
        await sequelize.authenticate();
        console.log('Conexion a MySQL establecida correctamente.');
        //chicos le pongo el force asi destruye las tablas y las crea devuelta asi vamos probando xd
        await sequelize.sync({ force: true});

        console.log('Todas las tablas fueron creadas correctamente');
        process.exit(0);
    } catch (error){
        console.error('Error al iniciar la base de datos:', error);
        process.exit(1);
    }
}
iniciarDB();