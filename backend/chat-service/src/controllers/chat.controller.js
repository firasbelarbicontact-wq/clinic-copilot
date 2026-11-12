const Conversation = require('../modules/Conversation');
const Message = require('../modules/Message');
const { findConversationFor, saveMessage } = require('../services/chat.service');

const fail = (res, code) =>
    res.status(code).json({ message: code === 404 ? 'Conversation introuvable' : 'Accès interdit' });

exports.list = async (req, res) => {
    const userId = req.user.id;
    const conversations = await Conversation.find({
        $or: [{ patientId: userId }, { doctorId: userId }],
    }).sort({ lastMessageAt: -1, updatedAt: -1 });
    res.json(conversations);
};

exports.create = async (req, res) => {
    const { patientId, doctorId } = req.body;
    if (!patientId || !doctorId) {
        return res.status(400).json({ message: 'patientId et doctorId obligatoires' });
    }
    if (req.user.id !== String(patientId) && req.user.id !== String(doctorId)) {
        return res.status(403).json({ message: 'Accès interdit' });
    }
    const conversation = await Conversation.findOneAndUpdate(
        { patientId: String(patientId), doctorId: String(doctorId) },
        { $setOnInsert: { lastMessage: '' } },
        { upsert: true, new: true }
    );
    res.status(201).json(conversation);
};

exports.messages = async (req, res) => {
    const { conversation, error } = await findConversationFor(req.params.id, req.user.id);
    if (error) return fail(res, error);

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 30, 100);

    const items = await Message.find({ conversationId: conversation._id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

    res.json(items.reverse());
};

exports.send = async (req, res) => {
    const { conversation, error } = await findConversationFor(req.params.id, req.user.id);
    if (error) return fail(res, error);

    const content = (req.body.content || '').trim();
    if (!content) return res.status(400).json({ message: 'Message vide' });

    const message = await saveMessage(conversation, req.user.id, content);
    const io = req.app.get('io');
    if (io) io.to(`conversation:${conversation._id}`).emit('message', message);

    res.status(201).json(message);
};

exports.markRead = async (req, res) => {
    const { conversation, error } = await findConversationFor(req.params.id, req.user.id);
    if (error) return fail(res, error);

    const result = await Message.updateMany(
        { conversationId: conversation._id, senderId: { $ne: req.user.id }, read: false },
        { read: true }
    );
    res.json({ updated: result.modifiedCount });
};