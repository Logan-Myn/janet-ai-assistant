# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Janet** is a WhatsApp-based AI productivity assistant for task management. It enables users to manage their Todoist tasks through natural conversation via text or voice messages on WhatsApp. The system uses Claude AI with Extended Thinking for intelligent reasoning, conflict detection, and task organization.

This is a Next.js 16 application built with React 19, TypeScript, and Tailwind CSS v4. The project uses the App Router architecture and is configured with pnpm as the package manager.

## Development Commands

**Start development server:**
```bash
pnpm dev
```
The app runs at http://localhost:3000 with hot module replacement.

**Build for production:**
```bash
pnpm build
```

**Start production server:**
```bash
pnpm start
```

**Run linter:**
```bash
pnpm lint
```
ESLint is configured with Next.js core web vitals and TypeScript presets.

## Core Features

**Task Management via Text or Voice:**
- Users interact with Janet through WhatsApp text messages or voice notes
- Voice messages are transcribed using OpenAI Whisper API
- AI automatically creates projects, tasks, subtasks, due dates, labels, and priorities in Todoist
- Natural language processing for task queries and updates

**Intelligent Reasoning (Extended Thinking):**
- Claude AI uses Extended Thinking to analyze task conflicts, dependencies, and scheduling issues
- Proactively identifies scheduling overlaps, deadline conflicts, unrealistic workloads
- Suggests multiple solutions with transparent reasoning
- Learns patterns via Mem0 to predict issues and optimize organization
- Visible thinking process shows AI reasoning

**Persistent Memory (Mem0):**
- Remembers work patterns, preferences, and project contexts across conversations
- Continuously learns user habits and task patterns
- Adjusts time estimates based on historical data

**Proactive Communication:**
- Sends reminders, nudges, and task summaries via WhatsApp
- Daily/weekly reviews of tasks and priorities
- Alerts for overdue tasks, blocked projects, or detected conflicts

## Architecture

**Frontend & Chat Interface:**
- WhatsApp Business API handles all messaging (text, voice, outgoing)
- Users interact through WhatsApp on any device

**Backend (Next.js Application):**
- Next.js 16+ with API routes handling WhatsApp webhooks
- Vercel AI SDK for streaming AI responses and tool calling
- MCP (Model Context Protocol) servers connecting to Todoist and Claude AI
- Mem0 integration for persistent memory and context
- OpenAI Whisper API for voice-to-text transcription
- Extended Thinking enabled for intelligent reasoning

**AI & Integration Layer:**
- Claude AI with Extended Thinking processes messages and generates responses
- Todoist MCP server enables task creation, updates, queries, and conflict checking
- Mem0 stores and retrieves user preferences and work patterns
- Whisper transcribes voice messages (supports 30+ languages)

**App Router Structure:**
- Uses Next.js App Router (app directory)
- `app/layout.tsx`: Root layout with Geist font family configuration
- `app/page.tsx`: Home page component
- `app/globals.css`: Global styles with Tailwind v4 and CSS variables for theming

**Styling:**
- Tailwind CSS v4 with PostCSS
- Custom theme configuration via CSS variables (`--background`, `--foreground`)
- Dark mode support via `prefers-color-scheme` media query
- Font variables: `--font-geist-sans` and `--font-geist-mono`

**TypeScript Configuration:**
- Path alias: `@/*` maps to project root
- Target: ES2017
- Strict mode enabled
- Module resolution: bundler

**Next.js Configuration:**
- Default configuration in `next.config.ts`
- Webhook endpoints for WhatsApp message delivery

## Key Technical Details

- React Server Components by default (App Router)
- Uses `next/font` for optimized font loading (Geist family)
- Static assets in `/public` directory
- ESLint config ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`

**Voice Message Support:**
- Supported formats: Opus, MP3, AAC, AMR
- Maximum file size: 16 MB
- OpenAI Whisper API: ~$0.006 per minute
- Processing time: 1-3 seconds for typical voice notes

**Extended Thinking Budgets:**
- Low: Quick decisions for simple tasks
- Medium: Standard reasoning for most scenarios
- High: Deep analysis for complex multi-task planning
- Maximum: Unlimited thinking for very complex situations

**Deployment:**
- Designed for Vercel, Railway, or Fly.io
- Webhook endpoints exposed for WhatsApp message delivery
- Environment variables required for WhatsApp Business API, Todoist API, OpenAI API, Mem0
