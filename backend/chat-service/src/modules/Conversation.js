const mongoose = require('mongoose');

// Une conversation = un patient + un médecin.
// Les identifiants viennent du service Identity (on les stocke tels quels).
const conversationSchema = new mongoose.Schema(
    {
        patientId: { type: String, required: true },
        doctorId: { type: String, required: true },
        lastMessageAt: { type: Date, default: null },
    },
    { timestamps: true }
);

// Une seule conversation par couple patient/médecin
conversationSchema.index({ patientId: 1, doctorId: 1 }, { unique: true });

module.exports = mongoose.model('Conversation', conversationSchema);