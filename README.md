# Janet - WhatsApp AI Assistant for Task Management

Janet is an intelligent WhatsApp-based productivity assistant that helps you manage Todoist tasks through natural conversation. Send text or voice messages to create, organize, and track your tasks - all from WhatsApp.

## Features

- **Natural Conversation**: Chat with Janet in plain language, no commands to remember
- **Voice Support**: Send voice messages that are automatically transcribed
- **Intelligent Conflict Detection**: Uses Claude AI Extended Thinking to identify scheduling conflicts, dependencies, and workload issues
- **Persistent Memory**: Learns your work patterns and preferences over time with Mem0
- **Task Management**: Create, update, and query Todoist tasks seamlessly
- **Proactive Assistance**: Get suggestions, detect potential problems, and receive smart recommendations

## Tech Stack

- **Frontend**: WhatsApp (via WhatsApp Business API)
- **Backend**: Next.js 16 with TypeScript
- **AI**: Claude 3.5 Sonnet with Extended Thinking
- **Voice**: OpenAI Whisper for transcription
- **Tasks**: Todoist API
- **Memory**: Mem0 cloud
- **Deployment**: Vercel

## Quick Start

1. **Clone and install dependencies**:
```bash
git clone <your-repo>
cd janet
pnpm install
```

2. **Set up environment variables**:
```bash
cp .env.example .env.local
# Fill in your API keys
```

3. **Start development server**:
```bash
pnpm dev
```

4. **Follow the detailed setup guide**: See [SETUP.md](./SETUP.md) for complete instructions

## Required API Keys

- WhatsApp Business API (Meta Developer Portal)
- OpenAI API (for Whisper transcription)
- Anthropic API (for Claude AI)
- Todoist API token
- Mem0 API key

See [SETUP.md](./SETUP.md) for detailed instructions on obtaining these keys.

## Project Structure

```
janet/
├── app/
│   ├── api/
│   │   ├── webhooks/whatsapp/   # WhatsApp webhook handlers
│   │   └── health/              # Health check endpoint
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── whatsapp/                # WhatsApp client
│   ├── whisper/                 # Voice transcription
│   ├── claude/                  # Claude AI integration
│   ├── todoist/                 # Todoist API wrapper
│   ├── mem0/                    # Memory management
│   └── utils/                   # Message processor
├── types/                       # TypeScript definitions
├── config/                      # Configuration
├── CLAUDE.md                    # Project documentation
├── SETUP.md                     # Setup guide
└── README.md                    # This file
```

## How It Works

1. User sends a text or voice message via WhatsApp
2. WhatsApp webhook delivers the message to Janet
3. Voice messages are transcribed using Whisper
4. User context is retrieved from Mem0
5. Claude AI processes the message with Extended Thinking
6. Tasks are created/updated in Todoist with conflict detection
7. Response is sent back to user via WhatsApp
8. Conversation is saved to memory for future reference

## Example Interactions

**Text Message:**
```
You: Create a task: Buy groceries tomorrow at 2 PM
Janet: ✓ Created task "Buy groceries" for tomorrow at 2 PM with normal priority.
```

**Voice Message:**
```
You: [Voice] "I need to work on the marketing materials for the dance festival tomorrow afternoon"
Janet: I see you want to work on marketing materials tomorrow afternoon, but you already have 'Call venue' at 2-3 PM and 'Meet with DJ' at 3:30 PM. Marketing usually takes you 2-3 hours. Would you like me to:
1. Schedule it for tomorrow morning (9-12 PM)
2. Move it to Thursday afternoon when you're free
3. Break it into two 1.5-hour sessions across different days?
```

## Development

**Run development server:**
```bash
pnpm dev
```

**Build for production:**
```bash
pnpm build
```

**Start production server:**
```bash
pnpm start
```

**Lint code:**
```bash
pnpm lint
```

## Local Testing

Use ngrok to expose your local server for WhatsApp webhook testing:

```bash
# Start dev server
pnpm dev

# In another terminal
ngrok http 3000
```

Update your WhatsApp webhook URL to the ngrok forwarding URL.

See [SETUP.md](./SETUP.md) for complete testing instructions.

## Deployment

Deploy to Vercel with one command:

```bash
vercel deploy --prod
```

Or connect your GitHub repository to Vercel for automatic deployments.

See [SETUP.md](./SETUP.md) for complete deployment instructions.

## Documentation

- [SETUP.md](./SETUP.md) - Complete setup and deployment guide
- [CLAUDE.md](./CLAUDE.md) - Technical architecture and development guide
- [Docs/Overview.md](./Docs/Overview.md) - Feature overview and technical details

## Configuration

### Extended Thinking Budgets

Configure thinking budgets in `.env.local`:
- `low`: Quick decisions (1000 tokens)
- `medium`: Standard reasoning (5000 tokens)
- `high`: Deep analysis (10000 tokens)
- `maximum`: Unlimited thinking

### Whisper Settings

- Model: `whisper-1`
- Language: Auto-detect or specify in `WHISPER_LANGUAGE`
- Supported formats: opus, mp3, aac, amr

## API Costs (Approximate)

- **OpenAI Whisper**: $0.006 per minute of audio
- **Claude API**: $3 per 1M input tokens, $15 per 1M output tokens
- **WhatsApp**: First 1000 conversations free, then $0.005-0.09 per conversation
- **Mem0**: Check mem0.ai for current pricing
- **Todoist**: Free tier (300 req/min)

## License

MIT

## Support

For issues, questions, or contributions, please open an issue on GitHub.

## Acknowledgments

Built with:
- [Next.js](https://nextjs.org)
- [Claude AI](https://anthropic.com)
- [OpenAI Whisper](https://openai.com/research/whisper)
- [Todoist](https://todoist.com)
- [Mem0](https://mem0.ai)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
