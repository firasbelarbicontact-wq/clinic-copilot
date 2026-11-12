require('dotenv').config();
const { io } = require('socket.io-client');
const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET_BASE64 === 'true'
    ? Buffer.from(process.env.JWT_SECRET, 'base64')
    : process.env.JWT_SECRET;
const tokenFor = (id, role) => jwt.sign({ sub: id, userId: id, role }, secret, { expiresIn: '10m' });

const url = 'http://localhost:3000';
const conversationId = process.argv[2];

const emit = (socket, event, ...args) => new Promise((resolve) => socket.emit(event, ...args, resolve));
const connected = (socket) => new Promise((res, rej) => {
    socket.on('connect', res);
    socket.on('connect_error', rej);
});

(async () => {
    const patient = io(url, { auth: { token: tokenFor('1', 'PATIENT') } });
    const doctor = io(url, { auth: { token: tokenFor('2', 'DOCTOR') } });
    doctor.on('message', (m) => console.log('Le médecin reçoit en direct :', m.content));
    await Promise.all([connected(patient), connected(doctor)]);
    console.log('Patient et médecin connectés');

    console.log('join patient :', await emit(patient, 'join', conversationId));
    console.log('join médecin :', await emit(doctor, 'join', conversationId));
    console.log('envoi :', await emit(patient, 'send_message', { conversationId, content: 'Bonjour docteur' }));

    const stranger = io(url, { auth: { token: tokenFor('99', 'PATIENT') } });
    await connected(stranger);
    console.log('join étranger (doit être refusé) :', await emit(stranger, 'join', conversationId));

    const fake = io(url, { auth: { token: 'faux' } });
    fake.on('connect_error', (e) => console.log('faux token refusé :', e.message));

    setTimeout(() => process.exit(0), 1500);
})();