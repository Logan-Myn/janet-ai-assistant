import axios from 'axios';
import type { WhatsAppMessage, WhatsAppMediaResponse } from '@/types';
import { config } from '@/config';

const WHATSAPP_API_URL = 'https://graph.facebook.com/v21.0';

export class WhatsAppClient {
  private get accessToken(): string {
    return config.whatsapp.accessToken;
  }

  private get phoneNumberId(): string {
    return config.whatsapp.phoneNumberId;
  }

  async sendTextMessage(to: string, message: string): Promise<void> {
    const payload: WhatsAppMessage = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: {
        body: message,
      },
    };

    try {
      await axios.post(
        `${WHATSAPP_API_URL}/${this.phoneNumberId}/messages`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw new Error('Failed to send WhatsApp message');
    }
  }

  async getMediaUrl(mediaId: string): Promise<WhatsAppMediaResponse> {
    try {
      const response = await axios.get<WhatsAppMediaResponse>(
        `${WHATSAPP_API_URL}/${mediaId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error getting media URL:', error);
      throw new Error('Failed to get media URL');
    }
  }

  async downloadMedia(mediaUrl: string): Promise<Buffer> {
    try {
      const response = await axios.get(mediaUrl, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
        responseType: 'arraybuffer',
      });

      return Buffer.from(response.data);
    } catch (error) {
      console.error('Error downloading media:', error);
      throw new Error('Failed to download media');
    }
  }

  async markAsRead(messageId: string): Promise<void> {
    try {
      await axios.post(
        `${WHATSAPP_API_URL}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }
}

export const whatsappClient = new WhatsAppClient();
