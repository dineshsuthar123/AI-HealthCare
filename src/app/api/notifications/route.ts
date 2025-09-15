import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

type ActivityType = 'symptom_check' | 'consultation' | 'prescription' | 'report' | 'emergency';

function mapActivityToNotification(activity: any) {
  const base = {
    id: activity._id?.toString() ?? `${activity.type}-${activity.date ?? ''}`,
    timestamp: activity.date ?? new Date().toISOString(),
  };

  switch (activity.type as ActivityType) {
    case 'consultation':
      return {
        ...base,
        type: 'appointment',
        title: 'Consultation update',
        message: activity.title || 'Your consultation has an update',
        action: { label: 'Open', href: '/consultations' }
      };
    case 'emergency':
      return {
        ...base,
        type: 'alert',
        title: 'Emergency notice',
        message: activity.description || 'An emergency action was recorded',
        action: { label: 'View', href: '/dashboard' }
      };
    case 'report':
      return {
        ...base,
        type: 'update',
        title: 'New report available',
        message: activity.title || 'A new health report is available',
        action: { label: 'View records', href: '/health-records' }
      };
    case 'prescription':
      return {
        ...base,
        type: 'reminder',
        title: 'Prescription update',
        message: activity.description || 'Your prescription has been updated',
        action: { label: 'Open', href: '/health-records' }
      };
    case 'symptom_check':
    default:
      return {
        ...base,
        type: 'update',
        title: 'Symptom check completed',
        message: activity.title || 'A symptom check result is ready',
        action: { label: 'View', href: '/symptom-checker' }
      };
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id)
      .select('recentActivities')
      .lean() as { recentActivities?: any[] } | null;

    const activities: any[] = Array.isArray(user?.recentActivities) ? user!.recentActivities! : [];
    const notifications = activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20)
      .map(mapActivityToNotification);

    return NextResponse.json({ notifications });
  } catch (err) {
    console.error('Notifications fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export const runtime = 'nodejs';