/**
 * Blockchain API Routes
 * 
 * POST /api/blockchain/register - Register a health record on blockchain
 * GET  /api/blockchain/verify   - Verify a health record
 * GET  /api/blockchain/status   - Get blockchain service status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getBlockchainService, BlockchainService, generateUserWalletAddress } from '@/lib/blockchain';
import connectDB from '@/lib/mongodb';
import HealthRecordModel from '@/models/HealthRecord';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');

        const blockchain = getBlockchainService();

        switch (action) {
            case 'status': {
                const isAvailable = blockchain.isAvailable();
                const networkInfo = isAvailable ? await blockchain.getNetworkInfo() : null;
                const balance = isAvailable ? await blockchain.getBalance() : null;
                const walletAddress = blockchain.getWalletAddress();

                return NextResponse.json({
                    success: true,
                    data: {
                        isAvailable,
                        network: networkInfo,
                        walletAddress,
                        balance,
                        userWalletAddress: generateUserWalletAddress(session.user.id || session.user.email || '')
                    }
                });
            }

            case 'verify': {
                const recordId = searchParams.get('recordId');
                if (!recordId) {
                    return NextResponse.json({ error: 'Record ID required' }, { status: 400 });
                }

                await connectDB();
                const record = await HealthRecordModel.findById(recordId);
                
                if (!record) {
                    return NextResponse.json({ error: 'Record not found' }, { status: 404 });
                }

                // Check ownership
                if (record.userId.toString() !== session.user.id) {
                    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
                }

                const patientAddress = generateUserWalletAddress(session.user.id || '');
                const result = await blockchain.verifyRecord(patientAddress, recordId, {
                    title: record.title,
                    type: record.type,
                    description: record.description,
                    date: record.date,
                    provider: record.provider,
                    notes: record.notes
                });

                return NextResponse.json({
                    success: true,
                    data: {
                        ...result,
                        recordId,
                        currentHash: BlockchainService.generateRecordHash({
                            title: record.title,
                            type: record.type,
                            description: record.description,
                            date: record.date,
                            provider: record.provider,
                            notes: record.notes
                        })
                    }
                });
            }

            case 'records': {
                const patientAddress = generateUserWalletAddress(session.user.id || '');
                const recordIds = await blockchain.getPatientRecordIds(patientAddress);

                return NextResponse.json({
                    success: true,
                    data: { recordIds }
                });
            }

            case 'access-logs': {
                const recordId = searchParams.get('recordId');
                if (!recordId) {
                    return NextResponse.json({ error: 'Record ID required' }, { status: 400 });
                }

                const logs = await blockchain.getAccessLogs(recordId);

                return NextResponse.json({
                    success: true,
                    data: { logs }
                });
            }

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('Blockchain GET error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { action, recordId, providerAddress, scope, durationInDays } = body;

        const blockchain = getBlockchainService();

        if (!blockchain.isAvailable()) {
            return NextResponse.json(
                { error: 'Blockchain service not available' },
                { status: 503 }
            );
        }

        switch (action) {
            case 'register': {
                if (!recordId) {
                    return NextResponse.json({ error: 'Record ID required' }, { status: 400 });
                }

                await connectDB();
                const record = await HealthRecordModel.findById(recordId);
                
                if (!record) {
                    return NextResponse.json({ error: 'Record not found' }, { status: 404 });
                }

                // Check ownership
                if (record.userId.toString() !== session.user.id) {
                    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
                }

                const metadata = await blockchain.registerRecord(recordId, {
                    title: record.title,
                    type: record.type,
                    description: record.description,
                    date: record.date,
                    provider: record.provider,
                    notes: record.notes
                });

                // Update record with blockchain metadata
                if (metadata) {
                    await HealthRecordModel.findByIdAndUpdate(recordId, {
                        $set: {
                            'blockchainMetadata.txHash': metadata.txHash,
                            'blockchainMetadata.blockNumber': metadata.blockNumber,
                            'blockchainMetadata.recordHash': metadata.recordHash,
                            'blockchainMetadata.registeredAt': metadata.timestamp,
                            'blockchainMetadata.isOnChain': true
                        }
                    });
                }

                return NextResponse.json({
                    success: true,
                    data: metadata
                });
            }

            case 'grant-consent': {
                if (!providerAddress) {
                    return NextResponse.json({ error: 'Provider address required' }, { status: 400 });
                }

                const txHash = await blockchain.grantConsent(
                    providerAddress,
                    scope || 'read',
                    durationInDays || 30
                );

                return NextResponse.json({
                    success: true,
                    data: { txHash }
                });
            }

            case 'revoke-consent': {
                if (!providerAddress) {
                    return NextResponse.json({ error: 'Provider address required' }, { status: 400 });
                }

                const txHash = await blockchain.revokeConsent(providerAddress);

                return NextResponse.json({
                    success: true,
                    data: { txHash }
                });
            }

            case 'revoke-record': {
                if (!recordId) {
                    return NextResponse.json({ error: 'Record ID required' }, { status: 400 });
                }

                const txHash = await blockchain.revokeRecord(recordId);

                // Update record in database
                await connectDB();
                await HealthRecordModel.findByIdAndUpdate(recordId, {
                    $set: {
                        'blockchainMetadata.isRevoked': true,
                        'blockchainMetadata.revokedAt': new Date()
                    }
                });

                return NextResponse.json({
                    success: true,
                    data: { txHash }
                });
            }

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('Blockchain POST error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
