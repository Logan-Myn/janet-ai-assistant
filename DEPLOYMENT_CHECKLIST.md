# Deployment Checklist

Use this checklist to ensure everything is configured correctly before deploying to production.

## Pre-Deployment

### API Keys & Credentials
- [ ] WhatsApp Business API credentials obtained
- [ ] WhatsApp permanent access token generated (not temporary)
- [ ] OpenAI API key active with billing enabled
- [ ] Anthropic API key active with billing enabled
- [ ] Todoist API token obtained
- [ ] Mem0 API key obtained (sign up at mem0.ai)

### Environment Variables
- [ ] .env.local created and filled with all credentials
- [ ] All required variables present (check .env.example)
- [ ] NEXT_PUBLIC_BASE_URL set correctly
- [ ] Webhook verify token matches between .env and Meta portal

### Local Testing
- [ ] Dependencies installed (`pnpm install`)
- [ ] Development server starts without errors
- [ ] ngrok tunnel working
- [ ] WhatsApp webhook verified successfully
- [ ] Test text message received and processed
- [ ] Test voice message transcribed correctly
- [ ] Task created in Todoist
- [ ] Response received in WhatsApp
- [ ] Check logs for errors

## Vercel Deployment

### Setup
- [ ] Vercel account created
- [ ] GitHub repository connected (optional)
- [ ] Project imported to Vercel

### Environment Variables in Vercel
- [ ] WHATSAPP_PHONE_NUMBER_ID
- [ ] WHATSAPP_BUSINESS_ACCOUNT_ID
- [ ] WHATSAPP_ACCESS_TOKEN
- [ ] WHATSAPP_WEBHOOK_VERIFY_TOKEN
- [ ] WHATSAPP_APP_SECRET
- [ ] OPENAI_API_KEY
- [ ] ANTHROPIC_API_KEY
- [ ] TODOIST_API_TOKEN
- [ ] MEM0_API_KEY
- [ ] NEXT_PUBLIC_BASE_URL (your-app.vercel.app)
- [ ] NODE_ENV=production
- [ ] CLAUDE_MODEL (optional)
- [ ] EXTENDED_THINKING_ENABLED=true (optional)
- [ ] DEFAULT_THINKING_BUDGET=medium (optional)

### Deploy
- [ ] Run `vercel deploy --prod` or deploy via dashboard
- [ ] Deployment successful
- [ ] No build errors
- [ ] Check deployment logs

## Post-Deployment

### WhatsApp Configuration
- [ ] Update webhook URL to production URL
- [ ] Format: `https://your-app.vercel.app/api/webhooks/whatsapp`
- [ ] Click "Verify and Save" in Meta portal
- [ ] Webhook verification successful

### Testing Production
- [ ] Send test text message
- [ ] Send test voice message
- [ ] Verify task creation in Todoist
- [ ] Check Vercel logs for processing
- [ ] Confirm response received in WhatsApp
- [ ] Test Extended Thinking with complex request
- [ ] Verify memory persistence across messages

### Monitoring
- [ ] Health endpoint responding: `/api/health`
- [ ] Vercel logs accessible
- [ ] Error tracking configured (optional)
- [ ] API usage monitoring enabled

### WhatsApp Business Verification (For Production)
- [ ] Business verification submitted (if using production number)
- [ ] Phone number verified
- [ ] Message templates approved (if needed)
- [ ] Rate limits reviewed

## Optimization (Optional)

### Performance
- [ ] Review function execution times in Vercel logs
- [ ] Optimize Claude thinking budgets if needed
- [ ] Cache frequently accessed Todoist data
- [ ] Monitor API response times

### Cost Optimization
- [ ] Track OpenAI Whisper usage
- [ ] Monitor Claude API token usage
- [ ] Review WhatsApp conversation costs
- [ ] Check Mem0 usage
- [ ] Set up billing alerts

### Features
- [ ] Customize Claude system prompts
- [ ] Adjust conflict detection rules
- [ ] Fine-tune memory patterns
- [ ] Add proactive reminders (future feature)
- [ ] Implement daily summaries (future feature)

## Troubleshooting

If something doesn't work:

1. **Check Vercel logs**: Dashboard → Logs
2. **Verify environment variables**: Settings → Environment Variables
3. **Test webhook**: Send message and check logs immediately
4. **Validate API keys**: Test each API separately
5. **Check WhatsApp Business portal**: Verify webhook status
6. **Review error messages**: Look for specific API errors

## Security

- [ ] Environment variables not committed to git
- [ ] .env.local in .gitignore
- [ ] Webhook signature verification enabled
- [ ] API keys have minimum required permissions
- [ ] Regular key rotation scheduled (recommended)

## Documentation

- [ ] README.md updated with project info
- [ ] SETUP.md reviewed
- [ ] CLAUDE.md reflects current architecture
- [ ] Team members have access to credentials (if applicable)

## Launch

- [ ] All checklist items completed
- [ ] Production deployment verified
- [ ] Ready for users! 🚀

## Next Steps After Launch

1. Monitor usage for first 24 hours
2. Collect user feedback
3. Track API costs
4. Identify areas for improvement
5. Plan feature enhancements
6. Review and optimize prompts
7. Add more sophisticated task parsing
8. Implement proactive features

---

**Note**: Keep this checklist updated as the project evolves.
