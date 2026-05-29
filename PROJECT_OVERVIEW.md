# Tclaw Telegram Bot - Complete Project Overview

## What You've Just Received

A **production-grade educational framework** for building intelligent Telegram bots with:

✅ **Agentic Architecture**: LLM-driven orchestration with tool integration  
✅ **5-Layer Memory System**: Short-term, working, long-term curated, profiles, task state  
✅ **RAG Semantic Search**: Local Chroma vector store for searching group messages  
✅ **MCP-Compatible Tools**: Telegram, GitHub, Notion (extensible)  
✅ **Intelligent Scheduling**: Cron jobs with heartbeat tracking  
✅ **Config-Driven LLM**: Swap OpenAI/Claude/local without code changes  
✅ **Privacy-First Design**: All data stays local by default  
✅ **Educational Code**: Heavy comments, clear patterns, learn-by-reading  

---

## Project Structure

```
Tclaw_Project/
├── README.md                 ← Start here for overview
├── SETUP.md                  ← Follow this for setup
├── .env.example              ← Copy to .env, add credentials
├── package.json              ← Dependencies
├── tsconfig.json             ← TypeScript config
├── build-project.js          ← Run this first to generate structure
│
├── src/                      ← TypeScript source code
│   ├── types.ts              ← Core type definitions
│   ├── config.ts             ← Configuration loading
│   ├── agent/                ← Agent orchestration
│   ├── memory/               ← Memory management (5 layers)
│   ├── rag/                  ← Vector search
│   ├── tools/                ← Tool implementations
│   ├── scheduler/            ← Cron & heartbeat
│   ├── telegram/             ← Telegram bot client
│   └── index.ts              ← Entry point
│
├── data/                     ← Persistent storage (git-ignored)
│   ├── memory/               ← All memory files
│   │   ├── MEMORY.md         ← Your edits here!
│   │   ├── USER.md           ← Profile
│   │   ├── SOUL.md           ← Behavior
│   │   ├── TOOLS.md          ← Environment
│   │   └── daily/            ← Auto-generated logs
│   ├── rag/                  ← Chroma vector store
│   └── state/                ← JSON state (heartbeat)
│
├── docs/
│   ├── ARCHITECTURE.md       ← Deep dive design
│   └── EXAMPLES.md           ← Memory file templates
│
└── dist/                     ← Compiled JavaScript (after build)
```

---

## Getting Started (3 Steps)

### Step 1: Generate Project Structure

```bash
cd C:\Users\hp\Desktop\Tclaw_Project
node build-project.js
```

Creates `src/` directory with all modules and `data/` directories.

### Step 2: Install & Configure

```bash
npm install
cp .env.example .env

# Edit .env with your credentials:
# - TELEGRAM_BOT_TOKEN (from BotFather)
# - LLM_PROVIDER + API key (OpenAI/Claude/local)
# - Optional: GITHUB_TOKEN, NOTION_API_KEY
```

### Step 3: Build & Run

```bash
npm run build          # Compile TypeScript
npm run dev            # Run with hot-reload
```

**That's it!** Send a message to your bot on Telegram.

---

## Key Concepts

### The 5 Memory Layers

**Why 5 layers?** Different data needs different persistence models:

| Layer | Storage | Duration | What | Edit? |
|-------|---------|----------|------|-------|
| Short-term | RAM | Session | Chat history | No |
| Working | RAM | Session | Ad-hoc notes | Programmatically |
| Long-term (curated) | MEMORY.md | Forever | Decisions, preferences | YES (manually) |
| Long-term (logs) | daily/YYYY-MM-DD.md | Forever | Raw events | No (append-only) |
| Profile | USER.md, SOUL.md, TOOLS.md | Forever | Identity, behavior, config | Manually |

**Example flow**:
1. User sends message → stored in short-term memory
2. Agent processes → logs action to today's daily log
3. Weekly review: consolidate daily logs → update MEMORY.md
4. Next decision: agent reads MEMORY.md + short-term → makes choice

### Agent Decision Loop

```
1. Get User Message
   ↓
2. Load Memory Context (MEMORY.md + profiles)
   ↓
3. Query RAG for relevant group messages
   ↓
4. Build comprehensive prompt with all context
   ↓
5. Call LLM (OpenAI/Claude/local)
   ↓
6. Parse response: text + tool calls
   ↓
7. Execute tools (Telegram/GitHub/Notion)
   ↓
8. Log actions to memory
   ↓
9. Return response to user
```

### RAG: Searching Group History

The bot can search across all group messages it's seen:

```
User: "What did people say about authentication?"
     ↓
Agent: "Let me search for authentication discussions"
     ↓
RAG: Queries Chroma vector store
     ↓
Returns: Top 5 messages matching "authentication"
     ↓
Agent: Includes these in LLM prompt for context
```

**Privacy**: Uses local Chroma, no data sent to cloud.

---

## Important Files to Know

### Memory Files (In `data/memory/`)

**MEMORY.md** - READ THIS FIRST
- Your curated decisions
- Recurring preferences
- Important commitments
- **You edit this manually**

**USER.md**
- Your name, timezone, language
- Groups being monitored
- Custom reminders

**SOUL.md**
- Bot behavior guidelines
- Communication style
- Privacy & safety rules

**TOOLS.md**
- API status
- Configuration notes
- Device info

**daily/YYYY-MM-DD.md** - Bot creates these
- Raw event logs
- Don't edit (append-only)
- Review weekly, consolidate into MEMORY.md

### Configuration File (`.env`)

All settings from environment variables:
- LLM provider & API keys
- Telegram bot token
- GitHub, Notion credentials
- RAG settings (indexing frequency, lookback days)
- Memory settings (where to store files)

**Never commit .env** - it contains secrets!

---

## Development Workflow

### Daily Development

```bash
npm run dev              # Start with hot-reload
# Edit code, changes auto-reload
# Send messages to bot to test
# Check data/memory/daily/ for logs
```

### Production Build

```bash
npm run build            # Compile TypeScript to JavaScript
npm start                # Run compiled code
# Or deploy dist/ to production server
```

### Debugging

1. **Check logs**: `data/memory/daily/YYYY-MM-DD.md`
2. **Enable debug**: `DEBUG=true` in `.env`
3. **Review decisions**: Look at agent reasoning field
4. **Check memory**: Open MEMORY.md, USER.md for patterns

---

## Learning Path

**New to the codebase?**

1. **Start**: Read `docs/ARCHITECTURE.md` for system overview
2. **Understand Memory**: Study `src/memory/` - it's the foundation
3. **Read Agent**: How does `src/agent/index.ts` orchestrate tools?
4. **Explore Tools**: How do `src/tools/*.ts` wrap external APIs?
5. **Trace a Flow**: Pick a feature, follow it through all layers
6. **Extend**: Add a new tool, modify memory, swap LLM

---

## Feature Examples

### 1. Summarize Group & Draft Reply

```
You: "Summarize #tech-team from past 24h and help me draft a response"

Bot:
- Searches RAG for messages from tech-team (past 24 hours)
- Reads MEMORY.md for your summary preferences
- Generates bullet-point summary
- Drafts reply matching tone from SOUL.md
- Shows you the draft
```

### 2. Schedule a Reminder

```
You: "Remind me in 5 minutes to check GitHub"

Bot:
- Parses the intent
- Creates a cron job (5 minute delay)
- Stores in heartbeat-state.json
- In 5 minutes: sends you the reminder
```

### 3. Create Daily Recurring Post

```
You: "Post 'Good morning team!' in #announcements every weekday at 9am"

Bot:
- Reads your timezone from USER.md
- Creates cron job: "0 9 * * 1-5" (9am Mon-Fri)
- Each morning: posts message to group
```

### 4. Scan for GitHub Issues

```
You: "Find critical issues in our-repo and create a summary GitHub issue"

Bot:
- Calls GitHub API to fetch issues from "our-repo"
- Filters for critical severity
- Reads SOUL.md: "always ask before creating external content"
- Asks for confirmation
- Creates summary issue in "main-repo"
```

### 5. Create Notion Summary

```
You: "Create a Notion page summarizing this week's discussions in #tech-team"

Bot:
- Queries RAG for messages from week
- Generates structured summary
- Calls Notion API
- Creates page with formatting from USER.md
- Stores page ID in MEMORY.md for future updates
```

---

## Extensibility: How to Add Features

### Adding a New Tool

```typescript
// 1. Create src/tools/slack.ts
class SlackTool extends BaseTool {
  name = "slack";
  description = "Send messages to Slack";
  parameters = [ /* ... */ ];
  
  async execute(input: Record<string, unknown>): Promise<ToolResult> {
    // Call Slack API
  }
}

// 2. Register in src/tools/registry.ts
toolRegistry.register(new SlackTool());

// 3. Agent automatically knows about it!
```

### Swapping the LLM

```env
# Switch providers by changing .env
LLM_PROVIDER=anthropic          # Changed from openai
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-sonnet
# Code doesn't change!
```

### Adding New Memory Layer

```typescript
// In src/memory/index.ts
private contexts: Map<string, string> = new Map();

async addContext(groupId: string, context: string) {
  this.contexts.set(groupId, context);
}
```

---

## Production Deployment

### Before Going Live

- [ ] Set `NODE_ENV=production` in `.env`
- [ ] Use production Telegram webhook instead of polling
- [ ] Set up PostgreSQL for conversation history
- [ ] Add rate limiting on tool calls
- [ ] Enable monitoring & alerting
- [ ] Regular backups of `data/memory/`
- [ ] Rotate API keys periodically

### Scaling Considerations

- Migrate from local Chroma to Chroma server
- Add caching layer (Redis)
- Database sharding for large message volumes
- Horizontal scaling with load balancer
- Message queue for async tool execution

---

## Common Questions

**Q: Does my data leave my machine?**  
A: Only when you explicitly call external APIs (GitHub, Notion, LLM). Telegram messages are read-only. Everything else stays local.

**Q: Can I change the LLM?**  
A: Yes! Update `.env` with `LLM_PROVIDER` and API keys. Code stays the same.

**Q: How do I add a new tool?**  
A: Create `src/tools/newtool.ts`, extend `BaseTool`, implement `execute()`. Done!

**Q: What if I want to store data in a database?**  
A: Replace file-based storage in `src/memory/filestore.ts` with DB queries.

**Q: Can I run this on Heroku/AWS/Azure?**  
A: Yes! Just `npm run build` and deploy the `dist/` folder. Make sure `.env` is set.

---

## Project Philosophy

✅ **Clarity over cleverness** - Code should be readable, even if not optimal  
✅ **Explicit over implicit** - Memory is written to files, not hidden in black boxes  
✅ **Educational** - Heavy comments, clear patterns, learn-by-reading  
✅ **Modular** - Tools, agents, memory are independently testable  
✅ **Privacy-first** - Local by default, cloud only when needed  
✅ **Extensible** - Design for customization, not just usage  

---

## Next Steps

1. **Setup**: Follow SETUP.md (takes 10 minutes)
2. **Run**: `node build-project.js && npm install && npm run dev`
3. **Explore**: Read `src/types.ts` to understand the data model
4. **Learn**: Study `src/memory/index.ts` - the foundation
5. **Extend**: Add your own memory preferences, tools, features
6. **Deploy**: Follow production deployment checklist

---

## Support & Resources

- **Questions about setup?** See SETUP.md
- **Confused about design?** Read docs/ARCHITECTURE.md
- **Need examples?** Check docs/EXAMPLES.md
- **Want to extend?** Look at existing tools in src/tools/
- **Debugging?** Check data/memory/daily/YYYY-MM-DD.md for logs

---

## License

MIT - Use, modify, learn, teach.

---

**Built with ❤️ for learning**

This project is designed to be educational. Read it, learn from it, extend it, teach others with it.

