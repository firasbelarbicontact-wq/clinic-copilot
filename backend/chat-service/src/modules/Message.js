const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
    {
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Conversation',
            required: true,
        },
        senderId: { type: String, required: true },
        senderRole: { type: String, enum: ['PATIENT', 'DOCTOR'], required: true },
        text: { type: String, required: true, trim: true, maxlength: 2000 },
        readAt: { type: Date, default: null },
    },
    { timestamps: true }
);

// Pour lire l'historique d'une conversation rapidement, du plus récent au plus ancien
messageSchema.index({ conversationId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);