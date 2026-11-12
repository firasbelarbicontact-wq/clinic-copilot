const mongoose = require('mongoose');
const Conversation = require('../modules/Conversation');
const Message = require('../modules/Message');

async function findConversationFor(conversationId, userId) {
    if (!mongoose.isValidObjectId(conversationId)) return { error: 404 };
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return { error: 404 };
    if (conversation.patientId !== userId && conversation.doctorId !== userId) return { error: 403 };
    return { conversation };
}

async function saveMessage(conversation, senderId, content) {
    const message = await Message.create({
        conversationId: conversation._id,
        senderId,
        content,
    });
    conversation.lastMessage = content.slice(0, 100);
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();
    return message;
}

module.exports = { findConversationFor, saveMessage };