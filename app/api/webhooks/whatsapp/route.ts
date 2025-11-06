import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookToken, verifyWebhookSignature } from '@/lib/whatsapp/verify';
import { processIncomingMessage } from '@/lib/utils/message-processor';
import type { WhatsAppWebhookPayload } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (!mode || !token || !challenge) {
      return NextResponse.json(
        { error: 'Missing parameters' },
        { status: 400 }
      );
    }

    const verifiedChallenge = verifyWebhookToken(mode, token, challenge);

    if (verifiedChallenge) {
      console.log('Webhook verified successfully');
      return new NextResponse(verifiedChallenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 403 }
    );
  } catch (error) {
    console.error('Error in webhook verification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    const body = await request.text();

    // Detect provider: Twilio sends form-encoded, Meta sends JSON
    const isTwilio = contentType.includes('application/x-www-form-urlencoded');

    if (isTwilio) {
      // Handle Twilio webhook
      console.log('Processing Twilio webhook');
      const params = new URLSearchParams(body);

      const messageBody = params.get('Body');
      const from = params.get('From')?.replace('whatsapp:', ''); // Remove whatsapp: prefix
      const messageSid = params.get('MessageSid');
      const mediaUrl = params.get('MediaUrl0'); // First media URL if exists
      const mediaContentType = params.get('MediaContentType0');

      if (!messageBody && !mediaUrl) {
        return NextResponse.json({ status: 'ignored' }, { status: 200 });
      }

      // Process Twilio message
      const twilioMessage = {
        id: messageSid || 'unknown',
        from: from || 'unknown',
        timestamp: Date.now().toString(),
        type: mediaUrl ? 'audio' : 'text',
        text: messageBody ? { body: messageBody } : undefined,
        audio: mediaUrl ? { id: mediaUrl, mime_type: mediaContentType } : undefined,
      };

      const twilioValue = {
        messaging_product: 'whatsapp',
        metadata: { display_phone_number: 'sandbox', phone_number_id: 'twilio-sandbox' },
        contacts: [{ profile: { name: from }, wa_id: from }],
      };

      try {
        await processIncomingMessage(twilioMessage as any, twilioValue as any);
      } catch (error) {
        console.error('Error processing Twilio message:', error);
      }

      return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      });
    } else {
      // Handle Meta webhook
      console.log('Processing Meta webhook');
      const signature = request.headers.get('x-hub-signature-256');

      const isValid = verifyWebhookSignature(body, signature);

      if (!isValid) {
        console.error('Invalid webhook signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 403 }
        );
      }

      const payload: WhatsAppWebhookPayload = JSON.parse(body);

      if (payload.object !== 'whatsapp_business_account') {
        return NextResponse.json({ status: 'ignored' }, { status: 200 });
      }

      for (const entry of payload.entry) {
        for (const change of entry.changes) {
          if (change.value.messages && change.value.messages.length > 0) {
            for (const message of change.value.messages) {
              try {
                await processIncomingMessage(message, change.value);
              } catch (error) {
                console.error('Error processing Meta message:', error);
              }
            }
          }
        }
      }

      return NextResponse.json({ status: 'ok' }, { status: 200 });
    }
  } catch (error) {
    console.error('Error in webhook handler:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
