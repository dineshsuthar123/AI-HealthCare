import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TelemedicineAppointment } from '@/models/TelemedicineAppointment';
import connectDB from '@/lib/mongodb';
import { z } from 'zod';

const appointmentSchema = z.object({
  doctorId: z.string(),
  appointmentDate: z.string().transform((str) => new Date(str)),
  type: z.enum(['consultation', 'follow_up', 'emergency', 'mental_health']),
  symptoms: z.array(z.string()).optional(),
  chiefComplaint: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = appointmentSchema.parse(body);

    await connectDB();

    // Check if doctor exists and is available
    // TODO: Implement doctor availability check

    // Create appointment
    const appointment = new TelemedicineAppointment({
      patientId: session.user.id,
      doctorId: validatedData.doctorId,
      appointmentDate: validatedData.appointmentDate,
      type: validatedData.type,
      symptoms: validatedData.symptoms,
      chiefComplaint: validatedData.chiefComplaint,
      priority: validatedData.priority,
      status: 'scheduled',
      // Generate meeting URL (in production, integrate with video service)
      meetingUrl: `https://meet.example.com/room/${Date.now()}`,
      meetingId: `meeting_${Date.now()}`,
    });

    await appointment.save();

    // TODO: Send confirmation emails/SMS
    // TODO: Create calendar events
    // TODO: Notify doctor

    return NextResponse.json({
      appointmentId: appointment._id,
      appointmentDate: appointment.appointmentDate,
      meetingUrl: appointment.meetingUrl,
      status: appointment.status,
    }, { status: 201 });
  } catch (error) {
    console.error('Appointment booking error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to book appointment' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query: any = {
      $or: [
        { patientId: session.user.id },
        ...(session.user.role === 'doctor' ? [{ doctorId: session.user.id }] : [])
      ]
    };

    if (status) {
      query.status = status;
    }

    const appointments = await TelemedicineAppointment
      .find(query)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name email profile.specialization')
      .sort({ appointmentDate: -1 })
      .limit(limit)
      .skip(offset);

    const total = await TelemedicineAppointment.countDocuments(query);

    return NextResponse.json({
      appointments,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      }
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}
