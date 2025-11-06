import { config } from '@/config';

const TWILIO_API_URL = 'https://api.twilio.com/2010-04-01';

export class TwilioWhatsAppClient {
  private get accountSid(): string {
    return config.twilio?.accountSid || '';
  }

  private get authToken(): string {
    return config.twilio?.authToken || '';
  }

  private get fromNumber(): string {
    return config.twilio?.whatsappNumber || '';
  }

  async sendTextMessage(to: string, message: string): Promise<void> {
    // Add whatsapp: prefix if not present
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    const formattedFrom = this.fromNumber.startsWith('whatsapp:')
      ? this.fromNumber
      : `whatsapp:${this.fromNumber}`;

    const payload = new URLSearchParams({
      To: formattedTo,
      From: formattedFrom,
      Body: message,
    });

    try {
      const response = await fetch(
        `${TWILIO_API_URL}/Accounts/${this.accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(
              `${this.accountSid}:${this.authToken}`
            ).toString('base64')}`,
          },
          body: payload.toString(),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('Twilio API error:', error);
        throw new Error('Failed to send WhatsApp message via Twilio');
      }

      const result = await response.json();
      console.log('Message sent via Twilio:', result.sid);
    } catch (error) {
      console.error('Error sending WhatsApp message via Twilio:', error);
      throw new Error('Failed to send WhatsApp message');
    }
  }
}

export const twilioWhatsAppClient = new TwilioWhatsAppClient();
