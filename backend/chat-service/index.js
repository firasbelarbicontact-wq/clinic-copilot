require('dotenv').config();
const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const chatRoutes = require('./src/routes/chat.routes');
const { initSocket } = require('./src/socket');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'UP' }));
app.use('/', chatRoutes);

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
});

const server = http.createServer(app);
app.set('io', initSocket(server));

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('MONGODB_URI manquant dans le fichier .env');
    process.exit(1);
}

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('MongoDB connecté');
        server.listen(PORT, () => console.log(`chat-service sur le port ${PORT}`));
    })
    .catch((err) => {
        console.error('Erreur MongoDB :', err.message);
        process.exit(1);
    });