const router = require('express').Router();
const { auth } = require('../middleware/auth');
const c = require('../controllers/chat.controller');

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.use(auth);
router.get('/conversations', wrap(c.list));
router.post('/conversations', wrap(c.create));
router.get('/conversations/:id/messages', wrap(c.messages));
router.post('/conversations/:id/messages', wrap(c.send));
router.patch('/conversations/:id/read', wrap(c.markRead));

module.exports = router;