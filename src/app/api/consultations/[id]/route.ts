import { NextResponse } from 'next/server';

// This route is deprecated. Use /api/consultations/cancel instead.
export function DELETE() {
    return NextResponse.json(
        { message: 'This route is deprecated. Use /api/consultations/cancel instead.' },
        { status: 410 }
    );
}
