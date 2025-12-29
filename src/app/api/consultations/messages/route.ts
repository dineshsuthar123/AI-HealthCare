import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import MessageModel from '@/models/Message';
import ConsultationModel from '@/models/Consultation';
import mongoose from 'mongoose';

export const runtime = 'nodejs';

// Get messages for a consultation
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const consultationId = searchParams.get('consultationId');
        const limit = parseInt(searchParams.get('limit') || '50');
        const before = searchParams.get('before'); // For pagination

        if (!consultationId || !mongoose.Types.ObjectId.isValid(consultationId)) {
            return NextResponse.json({ error: 'Valid consultation ID required' }, { status: 400 });
        }

        await connectDB();

        // Verify user has access to this consultation
        const consultation = await ConsultationModel.findOne({
            _id: consultationId,
            $or: [
                { patientId: session.user.id },
                { providerId: session.user.id }
            ]
        });

        if (!consultation) {
            return NextResponse.json({ error: 'Consultation not found or access denied' }, { status: 404 });
        }

        // Build query
        interface MessageQuery {
            consultationId: mongoose.Types.ObjectId;
            createdAt?: { $lt: Date };
        }

        const query: MessageQuery = { consultationId: new mongoose.Types.ObjectId(consultationId) };
        
        if (before) {
            query.createdAt = { $lt: new Date(before) };
        }

        const messages = await MessageModel.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        // Mark messages as read for the current user
        await MessageModel.updateMany(
            {
                consultationId: new mongoose.Types.ObjectId(consultationId),
                senderId: { $ne: new mongoose.Types.ObjectId(session.user.id) },
                isRead: false
            },
            {
                $set: { isRead: true, readAt: new Date() }
            }
        );

        return NextResponse.json({
            messages: messages.reverse(), // Return in chronological order
            hasMore: messages.length === limit
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}

// Send a new message
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { consultationId, content, type = 'text', fileUrl, fileName, fileSize } = await request.json();

        if (!consultationId || !mongoose.Types.ObjectId.isValid(consultationId)) {
            return NextResponse.json({ error: 'Valid consultation ID required' }, { status: 400 });
        }

        if (!content?.trim()) {
            return NextResponse.json({ error: 'Message content required' }, { status: 400 });
        }

        await connectDB();

        // Verify user has access to this consultation
        const consultation = await ConsultationModel.findOne({
            _id: consultationId,
            $or: [
                { patientId: session.user.id },
                { providerId: session.user.id }
            ]
        });

        if (!consultation) {
            return NextResponse.json({ error: 'Consultation not found or access denied' }, { status: 404 });
        }

        // Determine sender role
        const senderRole = consultation.providerId?.toString() === session.user.id ? 'provider' : 'patient';

        // Create message
        const message = await MessageModel.create({
            consultationId: new mongoose.Types.ObjectId(consultationId),
            senderId: new mongoose.Types.ObjectId(session.user.id),
            senderName: session.user.name || 'Unknown',
            senderRole,
            content: content.trim(),
            type,
            fileUrl,
            fileName,
            fileSize
        });

        // Update consultation's last activity
        await ConsultationModel.findByIdAndUpdate(consultationId, {
            lastActivityAt: new Date()
        });

        return NextResponse.json({
            success: true,
            message: {
                id: message._id.toString(),
                sender: session.user.id,
                senderName: session.user.name,
                senderRole,
                content: message.content,
                type: message.type,
                timestamp: message.createdAt,
                fileUrl: message.fileUrl,
                fileName: message.fileName
            }
        });
    } catch (error) {
        console.error('Error sending message:', error);
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }
}

// Get unread message count
export async function HEAD(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return new NextResponse(null, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const consultationId = searchParams.get('consultationId');

        await connectDB();

        let query: Record<string, unknown> = {
            senderId: { $ne: new mongoose.Types.ObjectId(session.user.id) },
            isRead: false
        };

        if (consultationId && mongoose.Types.ObjectId.isValid(consultationId)) {
            query.consultationId = new mongoose.Types.ObjectId(consultationId);
        } else {
            // Get all consultations for this user
            const consultations = await ConsultationModel.find({
                $or: [
                    { patientId: session.user.id },
                    { providerId: session.user.id }
                ]
            }).select('_id');

            query.consultationId = { $in: consultations.map(c => c._id) };
        }

        const count = await MessageModel.countDocuments(query);

        return new NextResponse(null, {
            status: 200,
            headers: {
                'X-Unread-Count': count.toString()
            }
        });
    } catch (error) {
        console.error('Error getting unread count:', error);
        return new NextResponse(null, { status: 500 });
    }
}
