const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    patientId: { type: String, required: true },
    doctorId: { type: String, required: true },
    lastMessage: { type: String, default: '' },
    lastMessageAt: { type: Date },
}, { timestamps: true });

conversationSchema.index({ patientId: 1, doctorId: 1 }, { unique: true });

module.exports = mongoose.model('Conversation', conversationSchema);