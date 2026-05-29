# Telegram Agent Bot - Educational Implementation

A comprehensive, production-grade Telegram bot built with an **agentic architecture**, featuring intelligent memory management (5 layers), RAG-powered semantic search, and modular MCP-compatible tools.

**This is an educational project** - read the code, learn the patterns, extend it.

## Quick Start (5 minutes)

```bash
# 1. Generate project structure
node build-project.js

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Edit .env with your credentials (see SETUP.md)

# 4. Build & run
npm run build
npm run dev
```

**That's it!** The bot is now running. Send it a message on Telegram.

## Architecture Overview

This project demonstrates a production-grade architecture for conversational AI assistants with persistent memory, semantic search, and external tool integration.

### Core Components

#### 1. **Agent System** (`src/agent/`)
The brain of the bot. Uses LangChain to:
- Parse user intent from messages
- Decide which tools to use
- Maintain conversation flow with memory context

**How it works**: Agent receives (user_message + memory_context + rag_results + available_tools) → LLM orchestration → tool calls → response

#### 2. **Memory System** (`src/memory/`)
Five-layer persistent memory architecture:

- **Short-term**: Current chat window (context window)
- **Working**: Ad-hoc notes within this session
- **File-backed Long-term**: 
  - `MEMORY.md` - Curated decisions, recurring preferences
  - `memory/YYYY-MM-DD.md` - Daily raw logs and events
- **Profile/Context**:
  - `USER.md` - User preferences, name, groups
  - `SOUL.md` - Bot behavior guidelines
  - `TOOLS.md` - Environment setup, account info
- **Task State**:
  - `heartbeat-state.json` - Cron job timestamps
  - Scheduled reminder tracking

**Key principle**: No "remembering" unless written to files. This makes memory explicit and auditable.

#### 3. **RAG System** (`src/rag/`)
Semantic search over group/channel conversation history:

- Indexes past 200 messages per group (configurable)
- Uses Chroma for local vector storage (privacy-first)
- Embeds messages via LLM provider
- Enables agent to search for relevant context before answering

**Why local Chroma**: Ensures privacy, simplifies deployment, educational clarity.

#### 4. **Tools** (`src/tools/`)
Modular tool interface (MCP-compatible design):

- **telegram.ts**: Message retrieval, sending, scheduling
- **github.ts**: Issue creation, repository search
- **notion.ts**: Page creation, content updates

Each tool wraps external API calls in a standard interface that the agent can invoke.

#### 5. **Scheduler** (`src/scheduler/`)
Handles time-based actions:

- Cron jobs for reminders and recurring messages
- Heartbeat system to track last run times
- Daily memory digest (consolidates daily logs into MEMORY.md)

---

## Project Structure

```
tclaw-bot/
├── src/
│   ├── agent/
│   │   ├── index.ts              # Agent orchestrator
│   │   ├── prompt-templates.ts   # LLM prompts
│   │   └── types.ts              # Agent interfaces
│   │
│   ├── memory/
│   │   ├── index.ts              # Memory manager (all 5 layers)
│   │   ├── file-store.ts         # File I/O operations
│   │   └── types.ts              # Memory interfaces
│   │
│   ├── rag/
│   │   ├── index.ts              # RAG orchestrator
│   │   ├── indexer.ts            # Message indexing
│   │   ├── query.ts              # Search interface
│   │   └── types.ts              # RAG types
│   │
│   ├── tools/
│   │   ├── telegram.ts           # Telegram API wrapper
│   │   ├── github.ts             # GitHub API wrapper
│   │   ├── notion.ts             # Notion API wrapper
│   │   ├── base.ts               # Tool interface
│   │   └── registry.ts           # Tool registration
│   │
│   ├── telegram/
│   │   ├── client.ts             # Bot client initialization
│   │   ├── handlers.ts           # Message/command handlers
│   │   └── types.ts              # Telegram types
│   │
│   ├── scheduler/
│   │   ├── index.ts              # Cron manager
│   │   ├── heartbeat.ts          # Heartbeat system
│   │   └── digest.ts             # Daily memory consolidation
│   │
│   ├── config/
│   │   ├── index.ts              # Config loader
│   │   └── types.ts              # Config types
│   │
│   ├── types/
│   │   └── index.ts              # Shared TypeScript types
│   │
│   └── index.ts                  # Entry point
│
├── data/
│   ├── memory/                   # MEMORY.md, daily logs
│   ├── rag/                      # Chroma vector store
│   └── state/                    # heartbeat-state.json
│
├── docs/
│   ├── ARCHITECTURE.md           # Detailed architecture
│   ├── SETUP.md                  # Setup guide
│   └── EXAMPLES.md               # Example memory files
│
├── .env.example                  # Environment template
├── package.json
├── tsconfig.json
└── README.md
```

---

## How Memory Works (Critical!)

### Write Rules

**MEMORY.md** (Curated, long-term):
- Decisions you've made ("User prefers morning reminders")
- Recurring preferences ("Always summarize in bullet points")
- Long-term commitments ("Monitor GitHub repo X for issues")

**memory/YYYY-MM-DD.md** (Daily raw logs):
- Event log ("User asked about weather at 10am")
- Scratch notes ("Group chat seemed tense, monitor morale")
- Raw context ("New group XYZ added, hasn't been indexed yet")

**USER.md** (Profile):
- Name, timezone, language preference
- List of groups/channels being monitored
- Custom reminder schedule

**SOUL.md** (Behavior):
- "Be concise in technical explanations"
- "Always ask before creating external content"
- "Remind user of deadlines proactively"

**TOOLS.md** (Environment):
- API keys (well, actually stored in .env)
- GitHub account, Notion workspace ID
- Telegram group IDs and settings

### Read Rules

**Before answering**:
1. Search MEMORY.md for relevant facts
2. Search daily logs for recent context
3. Load only needed lines (preserve context window)
4. Never infer old tasks unless explicitly in files

**In group contexts**:
- Only use RAG + message history
- Never reference MEMORY.md (personal memory stays private)

---

## Features & Use Cases

### 1. Summarize Group Messages
```
User: "Go to tech-team group and summarize the past 24 hours, draft a reply"

Flow:
→ Agent searches RAG for messages from "tech-team" in past 24h
→ Loads conversation + relevant MEMORY.md (preferences for summaries)
→ Drafts reply respecting tone guidelines (SOUL.md)
```

### 2. Schedule Reminders
```
User: "Remind me to send a message in 5 minutes"

Flow:
→ Agent parses intent + message content
→ Scheduler creates cron job (5 min trigger)
→ On trigger: Send message to user (DM)
```

### 3. Welcome Message + Daily Post
```
User: "Welcome to group X. Post a message every morning at 10am"

Flow:
→ Agent registers daily cron job (10am + user timezone from USER.md)
→ Template stored in heartbeat-state.json
→ Each day: Cron triggers → message posted to group
```

### 4. GitHub Issue Scanning
```
User: "Scan our-repo for issues and create GitHub issue in main-repo"

Flow:
→ Agent uses GitHub tool to fetch issues from "our-repo"
→ Filters for recent/critical (via RAG context + SOUL.md rules)
→ Creates formatted issue in "main-repo"
→ Logs action to memory/YYYY-MM-DD.md
```

### 5. Notion Summaries
```
User: "Create a Notion page summarizing this group"

Flow:
→ Agent queries RAG for group summary (semantic search)
→ Loads USER.md for formatting preferences
→ Uses Notion tool to create page
→ Stores page ID in MEMORY.md for future updates
```

---

## Configuration

### Environment Variables (.env)

```bash
# LLM Configuration (config-driven, pick one)
LLM_PROVIDER=openai                    # or "anthropic", "local"
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4

# Telegram
TELEGRAM_BOT_TOKEN=...

# GitHub
GITHUB_TOKEN=...
GITHUB_REPO_OWNER=...
GITHUB_REPO_NAME=...

# Notion
NOTION_API_KEY=...
NOTION_DATABASE_ID=...

# RAG
RAG_CHROMA_PATH=./data/rag            # Local vector store
RAG_INDEX_FREQUENCY=daily             # "hourly", "daily", "weekly"
RAG_LOOKBACK_DAYS=30

# Scheduler
SCHEDULER_TIMEZONE=UTC
```

### Memory Files (.md format)

All memory files live in `data/memory/`. See `docs/EXAMPLES.md` for templates.

---

## Development

### Install Dependencies
```bash
npm install
```

### Run in Dev Mode
```bash
npm run dev
```

### Build for Production
```bash
npm run build
npm start
```

### Run Tests
```bash
npm test
npm run test:watch
```

### Lint Code
```bash
npm run lint
```

---

## Key Design Principles

1. **Memory as Truth**: All context flows through explicit, persisted memory files.
2. **Privacy-First**: Local RAG, sensitive data never leaves the box.
3. **Transparency**: Clear file structure makes reasoning auditable.
4. **Educational**: Heavy comments, minimal magic, learn-by-reading codebase.
5. **Modularity**: Tools, agents, memory are independently testable.
6. **Config-Driven**: Swap LLM providers, tools, scheduling without code changes.

---

## Learning Path

**New to this codebase?** Start here:

1. **Understand the memory system** (`src/memory/`): Core foundation
2. **Read agent orchestration** (`src/agent/`): How tools are called
3. **Explore RAG implementation** (`src/rag/`): Semantic search
4. **Study tool wrappers** (`src/tools/`): How external APIs are abstracted
5. **Trace a feature**: Pick a use case above, follow the code flow

---

## Extensibility

### Adding a New Tool

1. Create `src/tools/newtool.ts` extending `BaseTool`
2. Implement `execute()` method
3. Register in `src/tools/registry.ts`
4. Add to agent prompt templates

### Swapping the LLM

Edit `src/config/index.ts` to load different providers (OpenAI, Claude, Ollama, etc.).

### Customizing Memory

Extend `MemoryManager` in `src/memory/index.ts` to add new file types or layers.

### Adding Cron Jobs

Use `src/scheduler/index.ts` to register new recurring tasks with heartbeat tracking.

---

## Documentation

- **[SETUP.md](./SETUP.md)** - Step-by-step setup guide, Telegram bot creation, environment configuration
- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - Deep dive into system design, memory layers, data flows, error handling
- **[EXAMPLES.md](./docs/EXAMPLES.md)** - Template memory files (MEMORY.md, USER.md, SOUL.md, TOOLS.md, daily logs)

Start with SETUP.md to get running, then explore ARCHITECTURE.md to understand the design.

---

## Production Considerations

- [ ] Set up persistent Telegram webhook (vs polling)
- [ ] Add database backend for conversation history (currently file-based)
- [ ] Implement rate limiting for API calls
- [ ] Add monitoring/alerting for failed jobs
- [ ] Migrate from Chroma-JS to native Chroma server for scale
- [ ] Implement conversation clustering for better RAG retrieval

---

## License

MIT
