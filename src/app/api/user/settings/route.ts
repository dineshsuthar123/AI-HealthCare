import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

type UserPreferences = Record<string, unknown>;
interface UserSettingsPayload {
  preferences?: UserPreferences;
  profile?: UserPreferences;
}

export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id)
      .select('preferences profile')
      .lean<{ preferences?: UserPreferences; profile?: UserPreferences }>();

    return NextResponse.json({
      preferences: user?.preferences ?? {},
      profile: user?.profile ?? {},
    });
  } catch (err) {
    console.error('GET /api/user/settings error:', err);
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as UserSettingsPayload;
    await connectDB();

    const update: Record<string, unknown> = {};

    if (body.preferences) {
      update['preferences'] = body.preferences;
    }
    if (body.profile) {
      // Only allow updating safe profile fields
      update['profile'] = {
        ...(body.profile?.name && { name: body.profile.name }),
        ...(body.profile?.email && { email: body.profile.email }),
        ...(body.profile?.phone && { phone: body.profile.phone }),
        ...(body.profile?.timezone && { timezone: body.profile.timezone }),
      };
    }

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $set: update },
      { new: true, runValidators: true }
    ).select('preferences profile');

    return NextResponse.json({
      success: true,
      preferences: user?.preferences ?? {},
      profile: user?.profile ?? {},
    });
  } catch (err) {
    console.error('PUT /api/user/settings error:', err);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
