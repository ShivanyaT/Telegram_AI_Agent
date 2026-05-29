# SETUP.md - Getting Started with Tclaw Telegram Bot

## Prerequisites

- **Node.js** 16+ (LTS recommended)
- **npm** 8+
- A **Telegram Bot Token** (from BotFather)
- **.env file** with API credentials

## Initial Setup

### 1. Install Dependencies

```bash
cd C:\Users\hp\Desktop\Tclaw_Project
npm install
```

This installs:
- LangChain (agent framework)
- node-telegram-bot-api (Telegram client)
- dotenv (env management)
- chroma-js (local vector store)
- node-cron (scheduling)
- TypeScript dev tools

### 2. Generate Project Structure

```bash
node build-project.js
```

This creates:
- `src/` directory with all modules
- `data/` directory with memory & RAG storage
- TypeScript configuration
- Example memory files

### 3. Create Environment File

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Required
TELEGRAM_BOT_TOKEN=your-bot-token-from-botfather

# LLM (pick one provider)
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4

# Optional tools
GITHUB_TOKEN=ghp_...
GITHUB_REPO_OWNER=your-org
GITHUB_REPO_NAME=your-repo

NOTION_API_KEY=ntn_...
NOTION_DATABASE_ID=...

# Configuration
RAG_CHROMA_PATH=./data/rag
RAG_INDEX_FREQUENCY=daily
RAG_LOOKBACK_DAYS=30

MEMORY_DATA_PATH=./data/memory
MEMORY_DAILY_DIGEST_TIME=09:00

SCHEDULER_TIMEZONE=UTC
```

### 4. Build TypeScript

```bash
npm run build
```

Compiles TypeScript to JavaScript in `dist/`.

### 5. Run Development Server

```bash
npm run dev
```

Starts the bot with hot-reload (ts-node).

For production:
```bash
npm start
```

---

## Getting Your Telegram Bot Token

1. **Open Telegram** and search for "@BotFather"
2. **Send**: `/start`
3. **Send**: `/newbot`
4. Follow prompts to create a bot
5. **Copy** the token (looks like `123456789:ABCdefGHIjklMNOpqrsTUVwxyzABCDef`)
6. **Paste** into `.env` as `TELEGRAM_BOT_TOKEN`

---

## Setting Up Optional Tools

### GitHub Tool

1. Create **Personal Access Token**:
   - Go to https://github.com/settings/tokens
   - Create `new token (classic)`
   - Permissions: `repo`, `workflow`
   - Copy token

2. Add to `.env`:
   ```env
   GITHUB_TOKEN=ghp_your-token-here
   GITHUB_REPO_OWNER=your-username
   GITHUB_REPO_NAME=target-repo-name
   ```

### Notion Tool

1. Create **Notion Integration**:
   - Go to https://www.notion.com/my-integrations
   - Create new integration
   - Copy API key

2. **Share Database**:
   - Open your Notion database
   - Click "Share" → Select your integration
   - Copy database ID from URL

3. Add to `.env`:
   ```env
   NOTION_API_KEY=ntn_your-key-here
   NOTION_DATABASE_ID=your-database-id
   ```

---

## Memory File Structure

After running the bot, you'll see:

```
data/
└── memory/
    ├── MEMORY.md          # Curated long-term decisions
    ├── USER.md            # Your profile
    ├── SOUL.md            # Bot behavior guidelines
    ├── TOOLS.md           # API status & config
    └── daily/
        ├── 2024-05-28.md  # Today's raw log
        ├── 2024-05-27.md  # Yesterday's log
        └── ...
```

### MEMORY.md (What to edit)

This is the **curated** file. Edit it manually to record:

```markdown
# Long-Term Memory

## Communication Preferences
- Prefer bullet-point summaries
- Use UTC timezone
- English language

## Recurring Tasks
- Monitor GitHub org "my-org" for security issues
- Check Notion database daily

## Important Contacts
- Tech lead: @john_doe
```

### daily/YYYY-MM-DD.md (Append-only log)

The bot **appends** events here automatically:

```markdown
[2024-05-28T10:30:00Z] Summarized tech-team (12 messages)
[2024-05-28T11:00:00Z] Created GitHub issue #42
[2024-05-28T11:05:00Z] Scheduled daily reminder: 9am announcements
```

The bot never modifies these - you review and manually consolidate into MEMORY.md.

---

## Key Concepts

### Short-Term vs Long-Term Memory

**Short-term** (ephemeral):
- Current conversation
- Session only
- Clears on restart

**Long-term** (persistent):
- MEMORY.md - curated
- daily logs - raw
- USER.md, SOUL.md, TOOLS.md - profiles

**When does agent use each?**
- Always reads long-term before answering
- Always logs decisions to daily log
- Consolidates daily log → MEMORY.md manually

### RAG: Searching Group Messages

The bot can search past group messages:

```
User: "What did we discuss about authentication?"
  ↓
Agent: Queries RAG for "authentication"
  ↓
RAG: Searches indexed messages from all groups
  ↓
Returns: Top 5 similar messages with dates/authors
  ↓
Agent: Includes these in LLM prompt
```

**Indexing**:
- Happens automatically (based on `RAG_INDEX_FREQUENCY`)
- Indexes past `RAG_LOOKBACK_DAYS` days
- Stores locally in `data/rag/` (Chroma)

### Scheduler: Setting Reminders & Recurring Tasks

```
User: "Remind me daily at 9am to review PRs"
  ↓
Agent: Creates cron job (9am every day)
  ↓
Scheduler: Tracks in heartbeat-state.json
  ↓
Daily at 9am: Sends reminder DM
```

---

## Troubleshooting

### "TELEGRAM_BOT_TOKEN is required"

- Check `.env` exists in project root
- Verify `TELEGRAM_BOT_TOKEN=...` is set
- Token should look like: `123456789:ABCdefGHIjkl...`

### "Cannot find module 'langchain'"

```bash
npm install
npm run build
```

### Bot doesn't respond

1. Check `.env` is correct
2. Run `npm run dev` (not `npm start`)
3. Check `data/memory/daily/*.md` for errors
4. Verify Telegram bot is connected (BotFather shows messages?)

### "Chroma not initialized"

```bash
node build-project.js    # Recreate data structure
npm run dev              # Run bot
```

---

## What's Next?

1. **Send a message** to your bot on Telegram
2. **Check the logs**: `data/memory/daily/YYYY-MM-DD.md`
3. **Edit MEMORY.md** to add your preferences
4. **Try a feature**:
   - "Summarize this group from past 24h"
   - "Create a reminder for 5 minutes from now"
   - "Post 'Good morning!' daily at 9am"

---

## Project Structure Overview

```
Tclaw_Project/
├── src/                    # TypeScript source
│   ├── types.ts            # Core interfaces
│   ├── config.ts           # Configuration loading
│   ├── agent/
│   │   └── index.ts        # Agent orchestration
│   ├── memory/
│   │   ├── index.ts        # Memory manager
│   │   └── filestore.ts    # File I/O
│   ├── rag/
│   │   └── index.ts        # Vector search
│   ├── tools/
│   │   ├── base.ts         # Tool interface
│   │   ├── telegram.ts     # Telegram API
│   │   ├── github.ts       # GitHub API
│   │   └── notion.ts       # Notion API
│   ├── scheduler/
│   │   └── index.ts        # Cron jobs
│   ├── telegram/
│   │   └── client.ts       # Telegram bot
│   └── index.ts            # Entry point
├── data/                   # Persistent storage
│   ├── memory/             # All memory files
│   │   ├── MEMORY.md       # Your edits here!
│   │   ├── USER.md
│   │   ├── SOUL.md
│   │   ├── TOOLS.md
│   │   └── daily/          # Raw logs (auto)
│   └── rag/                # Vector store
├── docs/
│   ├── ARCHITECTURE.md     # Deep dive
│   ├── SETUP.md            # This file
│   └── EXAMPLES.md         # Memory file examples
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── .env.example            # Template (copy to .env)
└── build-project.js        # Setup script
```

---

## Next Steps

- Read `ARCHITECTURE.md` for deep dive
- Review example memory files in `docs/EXAMPLES.md`
- Explore `src/` code with heavy comments
- Start with `src/types.ts` to understand data flow

---

## Support

For issues or questions:

1. Check logs: `data/memory/daily/*.md`
2. Verify `.env` configuration
3. Review error messages in console
4. Check `ARCHITECTURE.md` for design decisions

