Here is an overview of Janet, a AI-Assistant for task management and productivity.

### What It Is

A WhatsApp-based AI productivity assistant that helps you manage your work and personal tasks through natural conversation—via **text or voice**. Instead of manually organizing tasks in Todoist, you'll chat or speak to your AI assistant via WhatsApp, and it will automatically create, organize, and manage your projects and tasks.[1][2][3]

### Core Features

**Task Management via Text or Voice Chat**
- Tell your AI assistant about projects and tasks in natural language via WhatsApp—type messages or send voice notes[2][3][4]
- Voice messages are automatically transcribed to text using AI (OpenAI Whisper)[3][4][5]
- The assistant creates projects, tasks, subtasks, due dates, labels, and priorities in Todoist automatically[6][7][8]
- Review your task list, get summaries, and mark tasks complete through conversation[7][9][2]

**Hands-Free Voice Input**
- Record voice messages while driving, walking, cooking, or multitasking[4][2][3]
- AI transcription converts your speech to text instantly with high accuracy[5][3][4]
- Supports multiple languages for both transcription and processing[10][3]
- Natural speaking is often faster and more convenient than typing[2][4]

**Intelligent Reasoning & Conflict Detection**
- Claude uses Extended Thinking to analyze task conflicts, dependencies, and scheduling issues before taking action[11][12][13]
- Proactively identifies problems like scheduling overlaps, deadline conflicts, unrealistic workloads, and task dependencies[13][14][15]
- Suggests multiple solutions and explains reasoning transparently without deleting or losing tasks[12][13]
- Learns from your patterns via Mem0 to predict potential issues and optimize task organization[15][16][13]
- Asks for confirmation on complex changes and presents options when conflicts arise[13]
- Visible thinking process shows you how the AI reasons through problems[12]

**Intelligent Memory with Mem0**
- The assistant remembers your work patterns, preferences, and project contexts across all conversations[16][17]
- No need to repeatedly explain projects or priorities—it learns and recalls your habits[18][16]
- Continuously improves its understanding of how you work and what matters to you[16]
- Recognizes how long different task types typically take you and adjusts recommendations accordingly[13]

**Proactive Communication**
- The AI can send you reminders, nudges, and task summaries proactively via WhatsApp[19][1][2]
- Get daily or weekly reviews of your tasks and priorities[9][2]
- Receive alerts for overdue tasks, blocked projects, or detected conflicts[9][2][13]
- Warns you about overcommitment before it becomes a problem[13]

**Always Available**
- Chat or speak from anywhere—phone, computer, on the go—without switching apps[20][1][3]
- No need to develop separate mobile or desktop apps; WhatsApp works everywhere[1][9]

### Technical Architecture

**Frontend & Chat Interface**
- WhatsApp Business API handles all messaging (incoming text, voice, and outgoing)[21][22][23][19]
- Users interact naturally via text messages or voice notes in WhatsApp[3][1][9]

**Backend (Next.js Application)**
- Next.js 16+ with API routes handling WhatsApp webhooks[24][25][26]
- Vercel AI SDK for streaming AI responses and tool calling[27][28][24]
- MCP (Model Context Protocol) servers connecting to Todoist and Claude AI[25][29][24]
- Mem0 integration for persistent memory and context[28][30]
- OpenAI Whisper API for voice-to-text transcription[31][5][3]
- Extended Thinking enabled for intelligent reasoning and conflict detection[11][12]

**AI & Integration Layer**
- Claude AI with Extended Thinking processes your messages and generates intelligent responses[6][7][12]
- Todoist MCP server enables task creation, updates, queries, and conflict checking[8][32][33][7]
- Mem0 stores and retrieves user preferences, work patterns, and context[17][28][16]
- Whisper transcribes voice messages to text for processing[4][5][3]

**Deployment**
- Hosted on Vercel, Railway, or Fly.io (platforms you're already familiar with)[25]
- Webhook endpoints exposed for WhatsApp message delivery[34][21]

### How It Works (User Flow Examples)

**Example 1: Voice Message with Conflict Detection**

1. **You send a voice message on WhatsApp**: "I need to work on the marketing materials for the dance festival tomorrow afternoon"[2][3]

2. **WhatsApp Business API receives your voice message** and sends the audio file URL to your Next.js webhook endpoint[23][3]

3. **Your Next.js app processes the voice message**:
   - Downloads and transcribes the audio with Whisper[5][31][3]
   - Mem0 retrieves context about your work patterns and the dance festival project[28][16]
   - MCP queries existing Todoist tasks for tomorrow[33][35]
   - **Extended Thinking activates**: Claude analyzes and finds you already have "Call venue" at 2-3 PM and "Meet with DJ" at 3:30 PM tomorrow, plus marketing typically takes you 2-3 hours[11][12][13]

4. **The assistant responds with intelligent analysis**: "I see you want to work on marketing materials tomorrow afternoon, but you already have 'Call venue' at 2-3 PM and 'Meet with DJ' at 3:30 PM. Marketing usually takes you 2-3 hours. Would you like me to:
   1. Schedule it for tomorrow morning (9-12 PM)
   2. Move it to Thursday afternoon when you're free
   3. Break it into two 1.5-hour sessions across different days?
   
   What works best?"[12][13]

**Example 2: Dependency Detection**

1. **You type**: "Add task: send email to sponsors"[13]

2. **Extended Thinking process**:
   - MCP checks related tasks in the dance festival project[15][33]
   - Notices "Create sponsorship package" isn't complete yet[15][13]
   - Analyzes task dependencies[15][13]

3. **AI Response**: "I noticed 'Create sponsorship package' isn't done yet. Do you want me to add 'Send email to sponsors' as dependent on that task, or can you send it without the package ready?"[15][13]

**Example 3: Complex Project Creation**

1. **You send a voice message**: "Hey, I need to organize the dance festival project with 5 tasks: book venue, hire DJ, create marketing materials, sell tickets, and coordinate volunteers. Venue booking is urgent."[3][9]

2. **System processes**:
   - Transcribes voice to text[5][3]
   - Extended Thinking analyzes task dependencies and priorities[11][12][15]
   - Recognizes logical order: venue must be booked before tickets can be sold[13][15]
   - Creates project with intelligent task sequencing[7][8]

3. **Response**: "✓ Created 'Dance Festival' project with 5 tasks. I set 'Book venue' as P1 priority and made 'Sell tickets' dependent on it since you need the venue confirmed first. Should I also make the marketing materials dependent on the venue booking?"[9][13]

**Example 4: Workload Warning**

1. **You:** "Schedule all 5 marketing tasks for Monday"[13]

2. **Extended Thinking**:
   - Calculates estimated time (8 hours total)[13]
   - Checks Monday's schedule via MCP: 3 hours of existing meetings[33][13]
   - Recognizes only 5 free hours available[13]

3. **Response**: "These 5 marketing tasks would take about 8 hours total, but you only have 5 free hours on Monday after meetings. Want me to spread them across Monday-Tuesday, or should I help you reschedule some Monday meetings to make room?"[13]

### Key Benefits for You

**Eliminates Procrastination Triggers**
- Removes friction of opening apps and organizing tasks manually[1][9]
- Makes task capture instant and effortless—just send a text or voice message[20][1][2]
- Voice input allows hands-free capture while multitasking[4][2][3]
- Reduces decision fatigue with AI-suggested priorities and organization[9][13]
- Intelligent conflict detection prevents scheduling mistakes that lead to overwhelm[13]

**Works With Your Habits**
- Uses WhatsApp, an app you already check constantly[20][1]
- Natural conversation (text or voice) instead of rigid forms or interfaces[1][3][9]
- Available on all devices without additional apps[1]
- Speak naturally when typing is inconvenient[2][4]

**Gets Smarter Over Time**
- Mem0 learns your work style, priorities, and patterns[18][16]
- Adapts task suggestions to your preferences[16]
- Reduces need to provide context repeatedly[36][16]
- Learns how long tasks take you and adjusts estimates accordingly[13]
- Recognizes patterns in your scheduling and proactively prevents conflicts[15][13]

**Intelligent Decision Support**
- Never blindly overwrites or deletes tasks—always suggests adjustments[13]
- Explains trade-offs and reasoning transparently[12][13]
- Spots conflicts, dependencies, and bottlenecks before they become problems[15][13]
- Acts as a sanity check on your planning and commitments[13]
- Shows visible thinking process so you understand recommendations[12]

**Keeps You Accountable**
- Proactive reminders and check-ins[19][2][9]
- Can ask "What did you complete today?" to track progress[2][9]
- Regular reviews of overdue or stalled tasks[9]
- Warns about overcommitment before it happens[13]

**Truly Hands-Free Operation**
- Capture tasks while driving, walking, cooking, or exercising[3][4][2]
- No need to stop what you're doing to type[4][2]
- Voice transcription is instant and highly accurate[5][3]

### Voice Message Technical Details

**Supported Audio Formats**
- Opus, MP3, AAC, AMR[23]
- Maximum file size: 16 MB[23]
- 30+ languages supported for transcription[3][5]

**Transcription Options**
- **OpenAI Whisper API** (recommended): ~$0.006 per minute, highly accurate[31][5]
- **Self-hosted Whisper**: Infrastructure costs only, unlimited use[37][31]
- Processing time: Near-instant (1-3 seconds for typical voice notes)[3]

**Optional: Voice Responses**
- System can respond with AI-generated voice messages using Text-to-Speech[38][31]
- Creates fully conversational voice-to-voice interaction when desired[38][31]

### Extended Thinking Details

**Thinking Budget Control**
- **Low budget**: Quick decisions for simple tasks[11][12]
- **Medium budget**: Standard reasoning for most scenarios[11][12]
- **High budget**: Deep analysis for complex multi-task planning[12][11]
- **Maximum budget**: Unlimited thinking for very complex situations[11][12]

**Reasoning Capabilities**
- Analyzes scheduling overlaps and time constraints[14][13]
- Identifies task dependencies and logical sequencing[15][13]
- Evaluates multiple solution paths and recommends the best option[15][13]
- Considers historical patterns from Mem0 to predict issues[16][15][13]
- Explains reasoning visibly so you understand decisions[12]

### Summary

This system transforms WhatsApp into your personal AI productivity command center with **text and voice input**, **intelligent conflict detection**, and **transparent reasoning**. By combining Claude AI's Extended Thinking, Todoist's task management, Mem0's memory, Whisper's transcription, and WhatsApp's ubiquity, you get a completely frictionless way to capture, organize, and complete your work and personal projects—with an AI that actively thinks through problems, catches conflicts, and helps you make better decisions about your time.[20][4][1][2][9][3][11][12][15][13]

The result: less procrastination, better organization, hands-free task capture, intelligent conflict prevention, and more time actually doing the work instead of managing lists.[39][4][20][2][9][13]