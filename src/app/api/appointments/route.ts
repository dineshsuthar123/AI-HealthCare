import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { TelemedicineAppointment } from '@/models/TelemedicineAppointment';
import { User } from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { 
      doctorId, 
      appointmentDate, 
      type, 
      symptoms, 
      chiefComplaint,
      duration = 30 
    } = await request.json();

    if (!doctorId || !appointmentDate || !type) {
      return NextResponse.json(
        { error: 'Doctor ID, appointment date, and type are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify doctor exists and has correct role
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return NextResponse.json(
        { error: 'Invalid doctor selected' },
        { status: 400 }
      );
    }

    // Check for conflicting appointments
    const existingAppointment = await TelemedicineAppointment.findOne({
      doctorId,
      appointmentDate: new Date(appointmentDate),
      status: { $in: ['scheduled', 'in_progress'] },
    });

    if (existingAppointment) {
      return NextResponse.json(
        { error: 'Doctor is not available at this time' },
        { status: 409 }
      );
    }

    // Create appointment
    const appointment = await TelemedicineAppointment.create({
      patientId: session.user.id,
      doctorId,
      appointmentDate: new Date(appointmentDate),
      duration,
      type,
      symptoms: symptoms || [],
      chiefComplaint,
      status: 'scheduled',
      priority: type === 'emergency' ? 'urgent' : 'medium',
      meetingUrl: `https://meet.example.com/${Date.now()}`, // Replace with actual video conferencing service
      meetingId: `meeting_${Date.now()}`,
    });

    // Populate doctor information
    await appointment.populate('doctorId', 'name email profile.specialization');

    return NextResponse.json({
      success: true,
      appointment,
    });
  } catch (error) {
    console.error('Book appointment error:', error);
    return NextResponse.json(
      { error: 'Failed to book appointment' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const upcoming = searchParams.get('upcoming') === 'true';

    await connectDB();

    let query: any = {};
    
    // Build query based on user role
    if (session.user.role === 'doctor') {
      query.doctorId = session.user.id;
    } else {
      query.patientId = session.user.id;
    }

    if (status) {
      query.status = status;
    }

    if (upcoming) {
      query.appointmentDate = { $gte: new Date() };
    }

    const appointments = await TelemedicineAppointment.find(query)
      .populate('patientId', 'name email profile')
      .populate('doctorId', 'name email profile')
      .sort({ appointmentDate: upcoming ? 1 : -1 })
      .limit(20);

    return NextResponse.json({
      appointments,
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}
