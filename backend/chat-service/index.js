const http = require('http');
const express = require('express');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/clinic_chat';

const app = express();
app.use(express.json());

// Vérification de santé : utilisée par toi (curl) et par Docker
app.get('/health', (req, res) => {
    const dbReady = mongoose.connection.readyState === 1;
    res.status(dbReady ? 200 : 503).json({
        status: dbReady ? 'UP' : 'DOWN',
        service: 'chat-service',
        mongodb: dbReady ? 'connected' : 'disconnected',
    });
});

// Serveur HTTP créé à part : le WebSocket s'y branchera plus tard
const server = http.createServer(app);

async function start() {
    try {
        await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
        console.log('MongoDB connecté');
    } catch (err) {
        console.error('Connexion MongoDB impossible :', err.message);
        process.exit(1); // Docker relancera le service (restart: unless-stopped)
    }
    server.listen(PORT, () => console.log(`chat-service démarré sur le port ${PORT}`));
}

start();

module.exports = { app, server };