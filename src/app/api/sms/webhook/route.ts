import { NextRequest, NextResponse } from 'next/server';
import { smsService } from '@/lib/sms';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const params = new URLSearchParams(body);
    
    const from = params.get('From');
    const message = params.get('Body');

    if (!from || !message) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Process the incoming SMS message
    const response = await smsService.handleIncomingMessage(from, message);

    // Return TwiML response
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Message>${response}</Message>
    </Response>`;

    return new NextResponse(twimlResponse, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  } catch (error) {
    console.error('SMS webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
