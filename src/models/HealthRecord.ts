'use strict';

import mongoose from 'mongoose';

export interface IBlockchainMetadata {
    isOnChain: boolean;
    txHash?: string;
    blockNumber?: number;
    recordHash?: string;
    registeredAt?: Date;
    isRevoked?: boolean;
    revokedAt?: Date;
}

export interface IHealthRecord {
    userId: mongoose.Types.ObjectId;
    title: string;
    type: 'allergy' | 'medication' | 'condition' | 'vaccination' | 'lab' | 'other';
    description: string;
    date: Date;
    provider?: string;
    attachmentUrl?: string;
    isShared: boolean;
    notes?: string;
    blockchainMetadata?: IBlockchainMetadata;
    createdAt: Date;
    updatedAt: Date;
}

const BlockchainMetadataSchema = new mongoose.Schema<IBlockchainMetadata>(
    {
        isOnChain: { type: Boolean, default: false },
        txHash: { type: String },
        blockNumber: { type: Number },
        recordHash: { type: String },
        registeredAt: { type: Date },
        isRevoked: { type: Boolean, default: false },
        revokedAt: { type: Date }
    },
    { _id: false }
);

const HealthRecordSchema = new mongoose.Schema<IHealthRecord>(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        type: {
            type: String,
            required: true,
            enum: ['allergy', 'medication', 'condition', 'vaccination', 'lab', 'other'],
            default: 'other'
        },
        description: {
            type: String,
            required: true
        },
        date: {
            type: Date,
            required: true
        },
        provider: {
            type: String,
            trim: true
        },
        attachmentUrl: {
            type: String,
            trim: true
        },
        isShared: {
            type: Boolean,
            default: false
        },
        notes: {
            type: String
        },
        blockchainMetadata: {
            type: BlockchainMetadataSchema,
            default: () => ({ isOnChain: false })
        }
    },
    {
        timestamps: true
    }
);

// Add text index for search functionality
HealthRecordSchema.index({ title: 'text', description: 'text', notes: 'text' });

// Create model only if it doesn't exist (prevents model overwrite errors during hot reloading)
export const HealthRecordModel = mongoose.models.HealthRecord ||
    mongoose.model<IHealthRecord>('HealthRecord', HealthRecordSchema);

export default HealthRecordModel;
