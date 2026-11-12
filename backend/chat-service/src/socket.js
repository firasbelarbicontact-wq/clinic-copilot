const { Server } = require('socket.io');
const { verifyToken } = require('./middleware/auth');
const { findConversationFor, saveMessage } = require('./services/chat.service');

function initSocket(httpServer) {
    const io = new Server(httpServer, { cors: { origin: '*' } });

    // Authentification : refuse la connexion si le token est absent ou faux
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth?.token
                || (socket.handshake.headers.authorization || '').replace('Bearer ', '');
            socket.user = verifyToken(token);
            next();
        } catch (err) {
            next(new Error('Unauthorized'));
        }
    });

    io.on('connection', (socket) => {
        // Rejoindre la "salle" d'une conversation pour recevoir ses messages
        socket.on('join', async (conversationId, ack) => {
            try {
                const { conversation, error } = await findConversationFor(conversationId, socket.user.id);
                if (error) return ack?.({ ok: false, error });
                socket.join(`conversation:${conversation._id}`);
                ack?.({ ok: true });
            } catch (err) {
                console.error(err);
                ack?.({ ok: false, error: 500 });
            }
        });

        // Envoyer un message : sauvegarde en base puis diffusion à la salle
        socket.on('send_message', async ({ conversationId, content } = {}, ack) => {
            try {
                const { conversation, error } = await findConversationFor(conversationId, socket.user.id);
                if (error) return ack?.({ ok: false, error });
                const text = (content || '').trim();
                if (!text) return ack?.({ ok: false, error: 400 });

                const message = await saveMessage(conversation, socket.user.id, text);
                io.to(`conversation:${conversation._id}`).emit('message', message);
                ack?.({ ok: true });
            } catch (err) {
                console.error(err);
                ack?.({ ok: false, error: 500 });
            }
        });
    });

    return io;
}

module.exports = { initSocket };