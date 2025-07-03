import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import ConsultationModel from '@/models/Consultation';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const isPast = searchParams.get('isPast') === 'true';

        // Connect to the database
        await connectToDatabase();

        // Current date
        const now = new Date();

        let query = {
            patientId: session.user.id,
        };

        if (isPast) {
            // For past consultations: scheduled before now or status is completed/cancelled
            query = {
                ...query,
                $or: [
                    { scheduledFor: { $lt: now }, status: { $ne: 'cancelled' } },
                    { status: { $in: ['completed', 'cancelled'] } }
                ]
            };
        } else {
            // For upcoming consultations: scheduled after now and status is not completed or cancelled
            query = {
                ...query,
                scheduledFor: { $gte: now },
                status: { $nin: ['completed', 'cancelled'] }
            };
        }

        // Fetch consultations
        const consultations = await ConsultationModel.find(query)
            .populate('providerId', 'name specialty profileImage')
            .sort({ scheduledFor: isPast ? -1 : 1 })
            .lean();

        // Format the response
        const formattedConsultations = consultations.map(consultation => ({
            ...consultation,
            provider: consultation.providerId ? {
                name: consultation.providerId.name,
                specialty: consultation.providerId.specialty,
                profileImage: consultation.providerId.profileImage,
            } : null,
        }));

        return NextResponse.json(formattedConsultations);
    } catch (error) {
        console.error('Error fetching consultations:', error);
        return NextResponse.json({ error: 'Failed to fetch consultations' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();

        // Validate required fields
        if (!data.reason || !data.date || !data.time) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Connect to the database
        await connectToDatabase();

        // Prepare consultation data
        const scheduledFor = new Date(`${data.date}T${data.time}`);

        const consultationData = {
            patientId: session.user.id,
            reason: data.reason,
            type: data.type || 'video',
            status: 'scheduled',
            scheduledFor,
            duration: 30, // Default duration in minutes
            createdAt: new Date(),
        };

        // Create the consultation
        const newConsultation = await ConsultationModel.create(consultationData);

        return NextResponse.json(newConsultation);
    } catch (error) {
        console.error('Error creating consultation:', error);
        return NextResponse.json({ error: 'Failed to create consultation' }, { status: 500 });
    }
}
