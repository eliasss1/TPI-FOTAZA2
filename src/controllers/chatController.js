const { Chat, Mensaje, Usuario } = require('../models');
const { Op } = require('sequelize');

module.exports = {
    
    mostrarChatPrivado: async (req, res) => {
        try {
            const miId = req.session.usuario.id;
            const conUsuarioId = parseInt(req.params.conUsuarioId);

            
            if (miId === conUsuarioId) {
                return res.redirect('/');
            }

            const receptor = await Usuario.findByPk(conUsuarioId);
            if (!receptor) return res.redirect('/');

            
            let chat = await Chat.findOne({
                where: {
                    [Op.or]: [
                        { usuario1_id: miId, usuario2_id: conUsuarioId },
                        { usuario1_id: conUsuarioId, usuario2_id: miId }
                    ]
                }
            });

            
            if (!chat) {
                chat = await Chat.create({
                    usuario1_id: miId,
                    usuario2_id: conUsuarioId
                });
            }

            
            const mensajes = await Mensaje.findAll({
                where: { chat_id: chat.id },
                order: [['createdAt', 'ASC']]
            });

            res.render('Chat', {
                titulo: `Chat con ${receptor.username}`,
                receptor,
                chat,
                mensajes
            });

        } catch (error) {
            console.error("Error al cargar chat:", error);
            res.status(500).send("Error interno");
        }
    },

    
    enviarMensaje: async (req, res) => {
        try {
            const chatId = req.params.chatId;
            const miId = req.session.usuario.id;
            const { texto } = req.body;

            if (!texto || texto.trim() === '') {
                return res.redirect('/');
            }

            await Mensaje.create({
                texto: texto.trim(),
                chat_id: chatId,
                emisor_id: miId
            });

            const chat = await Chat.findByPk(chatId);
            const receptorId = chat.usuario1_id === miId ? chat.usuario2_id : chat.usuario1_id;

            res.redirect(`/chat/${receptorId}`);

        } catch (error) {
            console.error("Error al enviar mensaje:", error);
            res.status(500).send("Error interno");
        }
    },

    mostrarBandejaChats: async (req, res) => {
        try {
            const miId = req.session.usuario.id;

            const chats = await Chat.findAll({
                where: {
                    [Op.or]: [
                        { usuario1_id: miId },
                        { usuario2_id: miId }
                    ]
                },
                include: [
                    { model: Usuario, as: 'iniciador', attributes: ['id', 'username'] },
                    { model: Usuario, as: 'receptor', attributes: ['id', 'username'] },
                    { model: Mensaje, as: 'mensajes' }
                ]
            });

            const chatsFormateados = chats.map(chat => {
                const otroUsuario = chat.usuario1_id === miId ? chat.receptor : chat.iniciador;
                

                const msjs = chat.mensajes.sort((a, b) => b.createdAt - a.createdAt);
                const ultimoMensaje = msjs.length > 0 ? msjs[0].texto : 'Sin mensajes aun';
                const fecha = msjs.length > 0 ? msjs[0].createdAt : chat.updatedAt;

                return { otroUsuario, ultimoMensaje, fecha };
            });


            chatsFormateados.sort((a, b) => b.fecha - a.fecha);

            res.render('lista-chats', {
                titulo: 'Mis Mensajes',
                chats: chatsFormateados
            });

        } catch (error) {
            console.error("Error al cargar bandeja:", error);
            res.status(500).send("Error interno");
        }
    }
};