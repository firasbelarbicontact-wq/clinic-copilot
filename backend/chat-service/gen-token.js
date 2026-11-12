require('dotenv').config();
const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET_BASE64 === 'true'
    ? Buffer.from(process.env.JWT_SECRET, 'base64')
    : process.env.JWT_SECRET;

console.log(jwt.sign(
    { sub: process.argv[2], userId: process.argv[2], role: process.argv[3] },
    secret,
    { expiresIn: '1h' }
));