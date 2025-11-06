# Janet Setup Guide

Complete guide to setting up and deploying the Janet WhatsApp AI assistant.

## Prerequisites

Before you begin, ensure you have:

1. **Node.js 20+** and **pnpm** installed
2. **All API keys** ready (see .env.example for required keys)
3. **ngrok account** (free) for local testing
4. **Vercel account** (free) for deployment

## Step 1: Environment Setup

1. Copy the environment template:
```bash
cp .env.example .env.local
```

2. Fill in your API keys in `.env.local`:
   - WhatsApp Business API credentials from Meta Developer Portal
   - OpenAI API key
   - Anthropic API key
   - Todoist API token
   - Mem0 API key

## Step 2: Install Dependencies

```bash
pnpm install
```

## Step 3: Local Testing Setup

### Install ngrok

```bash
# macOS
brew install ngrok

# Or download from https://ngrok.com/download
```

### Configure ngrok

```bash
ngrok config add-authtoken YOUR_NGROK_AUTH_TOKEN
```

### Start Development Server

In one terminal:
```bash
pnpm dev
```

### Start ngrok Tunnel

In another terminal:
```bash
ngrok http 3000
```

ngrok will provide a forwarding URL like: `https://abc123.ngrok-free.app`

### Configure WhatsApp Webhook

1. Go to Meta Developer Portal: https://developers.facebook.com/apps
2. Select your app → WhatsApp → Configuration
3. Set Webhook URL: `https://abc123.ngrok-free.app/api/webhooks/whatsapp`
4. Set Verify Token: Same as `WHATSAPP_WEBHOOK_VERIFY_TOKEN` in .env.local
5. Subscribe to webhook fields: `messages`
6. Click "Verify and Save"

### Test the Integration

1. Send a text message to your WhatsApp test number:
   ```
   Create a task: Buy groceries
   ```

2. Check your terminal for logs showing:
   - Webhook received
   - Message processed
   - Claude AI response
   - Task created in Todoist

3. Test voice message:
   - Record a voice note in WhatsApp
   - Send it to your test number
   - Check logs for transcription and processing

### Debugging

Check logs in your terminal:
- WhatsApp webhook events
- Transcription results
- Claude AI responses
- Todoist API calls
- Mem0 memory operations

Common issues:
- **Webhook verification fails**: Check WHATSAPP_WEBHOOK_VERIFY_TOKEN matches
- **Signature verification fails**: Check WHATSAPP_APP_SECRET is correct
- **Transcription fails**: Verify OPENAI_API_KEY and audio format support
- **Task creation fails**: Check TODOIST_API_TOKEN permissions

## Step 4: Production Deployment

### Deploy to Vercel

1. Install Vercel CLI (optional):
```bash
pnpm add -g vercel
```

2. Deploy:
```bash
vercel deploy --prod
```

Or use the Vercel Dashboard:
- Connect your GitHub repository
- Import the project
- Configure environment variables
- Deploy

### Configure Environment Variables in Vercel

1. Go to Project Settings → Environment Variables
2. Add all variables from .env.local:
   - WHATSAPP_PHONE_NUMBER_ID
   - WHATSAPP_BUSINESS_ACCOUNT_ID
   - WHATSAPP_ACCESS_TOKEN
   - WHATSAPP_WEBHOOK_VERIFY_TOKEN
   - WHATSAPP_APP_SECRET
   - OPENAI_API_KEY
   - ANTHROPIC_API_KEY
   - TODOIST_API_TOKEN
   - MEM0_API_KEY
   - NEXT_PUBLIC_BASE_URL (set to your Vercel URL)

### Update WhatsApp Webhook URL

1. Go to Meta Developer Portal
2. Update Webhook URL to: `https://your-app.vercel.app/api/webhooks/whatsapp`
3. Click "Verify and Save"

### Test Production Deployment

1. Send a message to your WhatsApp number
2. Check Vercel logs for processing
3. Verify task creation in Todoist
4. Check response in WhatsApp

## Step 5: WhatsApp Business API Setup (if not done)

### Create Meta Developer App

1. Go to https://developers.facebook.com/
2. Create account and verify business
3. Create new app → Type: Business
4. Add WhatsApp product

### Get Test Phone Number

Meta provides a test number for development. Use this to send test messages to up to 5 pre-registered numbers.

### Register Test Recipients

1. WhatsApp → API Setup → To
2. Add phone numbers that can receive messages
3. Verify each number via WhatsApp

### Get Permanent Access Token

1. Create System User in Business Settings
2. Generate permanent token with whatsapp_business_messaging permission
3. Replace temporary token in .env.local

### Production Phone Number Setup

1. Add a phone number to your WhatsApp Business Account
2. Verify the phone number
3. Update WHATSAPP_PHONE_NUMBER_ID in environment variables

## Step 6: Monitoring and Maintenance

### Check Health Endpoint

```bash
curl https://your-app.vercel.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-04T...",
  "service": "Janet - WhatsApp AI Assistant"
}
```

### View Logs

**Local:**
- Check terminal output

**Vercel:**
- Dashboard → Project → Logs
- Real-time log streaming
- Filter by severity

### Monitor API Usage

Track costs for:
- **OpenAI Whisper**: $0.006/minute
- **Anthropic Claude**: $3/1M input tokens, $15/1M output tokens
- **Mem0**: Check pricing at mem0.ai
- **WhatsApp**: First 1000 conversations free, then ~$0.005-0.09 per conversation

## API Quotas and Limits

### WhatsApp
- Rate limits: 1000 messages per hour (free tier)
- Increase limits with business verification

### OpenAI
- Whisper: No specific rate limit, usage-based pricing
- Consider caching transcriptions if needed

### Anthropic
- Claude API: Tier-based rate limits
- Extended Thinking: Additional token usage

### Todoist
- 300 requests per minute
- Should be sufficient for personal use

### Mem0
- Check current limits in mem0.ai dashboard

## Troubleshooting

### Message not received
1. Check webhook URL is correct
2. Verify signature validation is working
3. Check WhatsApp subscription is active

### Voice transcription failing
1. Verify OpenAI API key
2. Check audio format (opus, ogg, mp3, aac supported)
3. Verify file size < 16MB

### Tasks not creating in Todoist
1. Check Todoist API token
2. Verify API permissions
3. Check project IDs are valid

### Memory not persisting
1. Verify Mem0 API key
2. Check user ID consistency
3. Review Mem0 dashboard for errors

## Next Steps

1. Customize Claude prompts in `lib/claude/client.ts`
2. Adjust conflict detection rules in `lib/todoist/client.ts`
3. Fine-tune memory patterns in `lib/mem0/memory.ts`
4. Add proactive reminders (see Overview.md for ideas)
5. Implement daily summaries
6. Add more sophisticated task parsing

## Support

- WhatsApp API: https://developers.facebook.com/docs/whatsapp
- Claude API: https://docs.anthropic.com
- OpenAI: https://platform.openai.com/docs
- Todoist: https://developer.todoist.com
- Mem0: https://docs.mem0.ai
