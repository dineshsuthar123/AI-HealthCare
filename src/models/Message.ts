import mongoose from 'mongoose';

export interface IMessage {
    _id: mongoose.Types.ObjectId;
    consultationId: mongoose.Types.ObjectId;
    senderId: mongoose.Types.ObjectId;
    senderName: string;
    senderRole: 'patient' | 'provider' | 'system';
    content: string;
    type: 'text' | 'file' | 'image' | 'system';
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    isRead: boolean;
    readAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const MessageSchema = new mongoose.Schema<IMessage>({
    consultationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Consultation',
        required: true,
        index: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    senderName: {
        type: String,
        required: true
    },
    senderRole: {
        type: String,
        enum: ['patient', 'provider', 'system'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['text', 'file', 'image', 'system'],
        default: 'text'
    },
    fileUrl: {
        type: String
    },
    fileName: {
        type: String
    },
    fileSize: {
        type: Number
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Index for efficient message retrieval
MessageSchema.index({ consultationId: 1, createdAt: 1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });

export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
