# Proyecto Integrador: FOTAZA 2 - Programación Web II

**Materia:** Programación Web II – Desarrollador de Software
**Universidad:** Universidad de La Punta (ULP)

## Integrantes
- Victor Mariano Pelaez
- Elias Pereyra Aguilar
- Esteban Maximiliano Lagos

## 📌 Enlaces del Proyecto
* **Repositorio en GitHub:** https://github.com/eliasss1/TPI-FOTAZA2.git
* **Aplicación en Producción (Vercel):** https://tpi-fotaza-2-lime.vercel.app/
* **Video Demostrativo:** [PEGAR_AQUI_URL_VIDEO]

## 🛠️ Tecnologías Utilizadas
* **Backend:** Node.js, Express
* **Motor de Plantillas:** PUG (Renderizado del lado del servidor)
* **Base de Datos:** Postgres SQL
* **Frontend:**  Bootstrap,  PUG

## Usuarios de Prueba
- **Rol Administrador**: user: maxpowers@gmail.com | pass: 67890
- **Rol Usuario**: user: joaquingonzalez@gmail.com | pass: 12345

## 🚀 Instrucciones de Despliegue Local
Para ejecutar este proyecto en tu entorno local, sigue estrictamente los siguientes pasos:

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/eliasss1/TPI-FOTAZA2.git

2. **Instalar las dependencias necesarias:**
   ```bash
   npm install

3. **Configurar las variables de entorno**
   - Crea un archivo llamado .env en la raíz del proyecto y copia las variables definidas en el archivo .env.example. Configura allí los datos correspondientes a tu base de datos local y los puertos.

4. **Inicializar la base de datos (creación de tablas)**
    ```bash
    npm run db:init

5. **Ejecutar la aplicación**
    ```bash
    npm start   

6. **Acceder a la plataforma**

    - Abre tu navegador web y dirígete a: http://localhost:3000

## 📝Informe de Desarrollo (Problemas y Soluciones)
Durante el desarrollo del proyecto FOTAZA 2, nos encontramos con distintos desafíos que pudimos solucionar de la siguiente manera:

**Conflictos con la persistencia de la sesión en Express**
- Problema: Al intentar cerrar sesión y entrar con otra cuenta, en ocasiones seguían apareciendo datos del perfil anterior.

- Solución: Aseguramos que la ruta de logout destruyera completamente la sesión usando req.session.destroy y eliminara las cookies correspondientes del navegador mediante res.clearCookie.

**Lógica de Moderación y Denuncias de Comentarios/Publicaciones**

- Problema: Se nos complicó estructurar la vista del "Validador" para que solamente viera lo necesario, y tuvimos dificultades con los checkboxes booleanos en PUG.

- Solución: Implementamos consultas condicionales usando Sequelize que filtran únicamente las publicaciones agrupadas usando HAVING COUNT >= 3 denuncias. Además, ajustamos el envío del formulario para guardar correctamente el campo booleano comentarios_abiertos en la base de datos cuando el validador destilda la opción.

**Problemas con variables globales y textos estáticos en PUG**

- Problema: La vista del perfil de usuario (perfil.pug) no mostraba los datos reales de la cuenta, sino que renderizaba textos "hardcodeados" (fijos).

- Solución: Configuramos un middleware global en app.js (res.locals.usuario = req.session.usuario) para que la información del usuario logueado esté disponible dinámicamente en todas las vistas de Pug, evitando tener que inyectar la variable manualmente en cada ruta.

**Inconsistencias de módulos al trabajar en equipo con Git**

- Problema: En el trabajo colaborativo, aparecían errores del tipo Cannot find module 'formidable' o de dependencias faltantes al descargar los cambios de otro integrante del equipo.

- Solución: Establecimos la convención de ejecutar siempre npm install tras hacer un pull del repositorio remoto. Esto aseguró que las nuevas librerías agregadas al package.json se instalaran correctamente en cada entorno local antes de levantar el servidor.   
