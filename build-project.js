/**
 * Comprehensive Source Generator - All Core Modules
 * This combines all generators into one master script
 * Run with: node build-project.js
 */

const fs = require('fs');
const path = require('path');

function mkdirSync(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function writeFile(filePath, content) {
  const dir = path.dirname(filePath);
  mkdirSync(dir);
  fs.writeFileSync(filePath, content);
  console.log(`✓ Generated: ${filePath}`);
}

// ============================================================================
// 1. TYPES
// ============================================================================

const types = `/**
 * Core TypeScript Types for Telegram Agent Bot
 */

// Memory Types
export interface MemoryLayer {
  type: 'short_term' | 'working' | 'long_term' | 'profile' | 'task_state';
  content: string | Record<string, unknown>;
  timestamp: Date;
}

export interface MemoryContext {
  shortTerm: string;
  working: Record<string, unknown>;
  relevantMemory: string;
  userProfile: UserProfile;
  toolsContext: ToolsContext;
}

export interface UserProfile {
  name: string;
  timezone: string;
  language: string;
  preferredGroups: string[];
  customReminders: Record<string, unknown>;
}

export interface ToolsContext {
  availableTools: string[];
  apiStatus: Record<string, boolean>;
  lastSyncTimestamp: Record<string, Date>;
}

// Agent Types
export interface AgentInput {
  userMessage: string;
  conversationHistory: ConversationTurn[];
  memoryContext: MemoryContext;
  ragContext?: RagResult[];
  currentGroupId?: string;
}

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AgentOutput {
  response: string;
  toolCalls: ToolCall[];
  confidence: number;
  reasoning: string;
}

export interface ToolCall {
  toolName: string;
  toolInput: Record<string, unknown>;
  executionId: string;
}

export interface ToolResult {
  toolName: string;
  executionId: string;
  success: boolean;
  result: unknown;
  error?: string;
}

// RAG Types
export interface RagIndexEntry {
  id: string;
  groupId: string;
  messageId: string;
  authorId: string;
  content: string;
  embeddings: number[];
  timestamp: Date;
}

export interface RagQuery {
  query: string;
  groupId: string;
  limit?: number;
  timeframe?: 'last_24h' | 'last_7d' | 'last_30d' | 'all';
}

export interface RagResult {
  messageId: string;
  similarity: number;
  content: string;
  author: string;
  timestamp: Date;
}

// Tool Types
export interface BaseTool {
  name: string;
  description: string;
  parameters: ToolParameter[];
  execute(input: Record<string, unknown>): Promise<ToolResult>;
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  defaultValue?: unknown;
}

export interface TelegramMessage {
  messageId: string;
  groupId: string;
  authorId: string;
  authorName: string;
  content: string;
  timestamp: Date;
}

export interface ScheduledMessage {
  id: string;
  groupId?: string;
  userId?: string;
  content: string;
  scheduledFor: Date;
  cronExpression?: string;
  status: 'pending' | 'sent' | 'failed';
}

export interface GitHubIssue {
  id: string;
  repository: string;
  title: string;
  description: string;
  labels: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface NotionPage {
  id: string;
  title: string;
  content: string;
  properties: Record<string, unknown>;
}

// Config
export interface BotConfig {
  llmProvider: 'openai' | 'anthropic' | 'local';
  llmModel: string;
  telegram: {
    botToken: string;
    webhookUrl?: string;
  };
  tools?: {
    github?: { token: string; owner: string; repo: string };
    notion?: { apiKey: string; databaseId: string };
  };
  rag: {
    chromaPath: string;
    indexFrequency: 'hourly' | 'daily' | 'weekly';
    lookbackDays: number;
  };
  memory: {
    dataPath: string;
    dailyDigestTime: string;
  };
  scheduler: {
    timezone: string;
  };
}

// Error Handling
export class BotError extends Error {
  constructor(
    public code: string,
    message: string,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'BotError';
  }
}

export enum ErrorCode {
  MEMORY_READ_ERROR = 'MEMORY_READ_ERROR',
  MEMORY_WRITE_ERROR = 'MEMORY_WRITE_ERROR',
  RAG_INDEX_ERROR = 'RAG_INDEX_ERROR',
  RAG_QUERY_ERROR = 'RAG_QUERY_ERROR',
  AGENT_EXECUTION_ERROR = 'AGENT_EXECUTION_ERROR',
  TOOL_NOT_FOUND = 'TOOL_NOT_FOUND',
  TOOL_EXECUTION_FAILED = 'TOOL_EXECUTION_FAILED',
  TELEGRAM_API_ERROR = 'TELEGRAM_API_ERROR',
  CONFIG_MISSING = 'CONFIG_MISSING',
}
`;

// ============================================================================
// 2. CONFIGURATION
// ============================================================================

const config = `/**
 * Configuration Module
 */

import dotenv from 'dotenv';
import { BotConfig, ErrorCode, BotError } from './types';

dotenv.config();

export function loadConfig(): BotConfig {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    throw new BotError(
      ErrorCode.CONFIG_MISSING,
      'TELEGRAM_BOT_TOKEN is required'
    );
  }

  return {
    llmProvider: (process.env.LLM_PROVIDER || 'openai') as any,
    llmModel: process.env.OPENAI_MODEL || 'gpt-4',
    telegram: {
      botToken: process.env.TELEGRAM_BOT_TOKEN,
      webhookUrl: process.env.TELEGRAM_WEBHOOK_URL,
    },
    tools: {
      github: process.env.GITHUB_TOKEN
        ? {
            token: process.env.GITHUB_TOKEN,
            owner: process.env.GITHUB_REPO_OWNER || '',
            repo: process.env.GITHUB_REPO_NAME || 'main-repo',
          }
        : undefined,
      notion: process.env.NOTION_API_KEY
        ? {
            apiKey: process.env.NOTION_API_KEY,
            databaseId: process.env.NOTION_DATABASE_ID || '',
          }
        : undefined,
    },
    rag: {
      chromaPath: process.env.RAG_CHROMA_PATH || './data/rag',
      indexFrequency: (process.env.RAG_INDEX_FREQUENCY || 'daily') as any,
      lookbackDays: parseInt(process.env.RAG_LOOKBACK_DAYS || '30'),
    },
    memory: {
      dataPath: process.env.MEMORY_DATA_PATH || './data/memory',
      dailyDigestTime: process.env.MEMORY_DAILY_DIGEST_TIME || '09:00',
    },
    scheduler: {
      timezone: process.env.SCHEDULER_TIMEZONE || 'UTC',
    },
  };
}

export function getLLMConfig(config: BotConfig): Record<string, string> {
  switch (config.llmProvider) {
    case 'openai':
      return {
        apiKey: process.env.OPENAI_API_KEY || '',
        model: process.env.OPENAI_MODEL || 'gpt-4',
      };
    case 'anthropic':
      return {
        apiKey: process.env.ANTHROPIC_API_KEY || '',
        model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet',
      };
    case 'local':
      return {
        baseURL: process.env.LOCAL_LLM_URL || 'http://localhost:8000',
        model: process.env.LOCAL_LLM_MODEL || 'llama2',
      };
    default:
      throw new BotError(ErrorCode.CONFIG_MISSING, 'Unknown LLM provider');
  }
}
`;

// ============================================================================
// 3. MEMORY FILE STORE
// ============================================================================

const memoryFileStore = `/**
 * Memory File Store - Atomic file operations
 */

import fs from 'fs/promises';
import path from 'path';
import { BotError, ErrorCode } from './types';

export class MemoryFileStore {
  constructor(private basePath: string) {}

  async initialize(): Promise<void> {
    await fs.mkdir(this.basePath, { recursive: true });
    await fs.mkdir(path.join(this.basePath, 'daily'), { recursive: true });

    const defaultFiles: Record<string, string> = {
      'MEMORY.md': '# Long-Term Memory\\n\\n## Decisions & Preferences\\n\\n## Commitments\\n',
      'USER.md': '# User Profile\\n\\n## Identity\\n- Name: User\\n- Timezone: UTC\\n',
      'SOUL.md': '# Bot Behavior Guidelines\\n\\n## Communication Style\\n- Be concise\\n',
      'TOOLS.md': '# Tools & Environment\\n\\n## API Status\\n- Configured\\n',
    };

    for (const [file, content] of Object.entries(defaultFiles)) {
      try {
        await fs.stat(path.join(this.basePath, file));
      } catch {
        await fs.writeFile(path.join(this.basePath, file), content);
      }
    }
  }

  async readFile(filename: string): Promise<string> {
    try {
      return await fs.readFile(path.join(this.basePath, filename), 'utf-8');
    } catch (error) {
      throw new BotError(ErrorCode.MEMORY_READ_ERROR, \`Failed to read \${filename}\`);
    }
  }

  async writeFile(filename: string, content: string): Promise<void> {
    try {
      const filePath = path.join(this.basePath, filename);
      const tempPath = \`\${filePath}.tmp\`;
      await fs.writeFile(tempPath, content);
      await fs.rename(tempPath, filePath);
    } catch (error) {
      throw new BotError(ErrorCode.MEMORY_WRITE_ERROR, \`Failed to write \${filename}\`);
    }
  }

  async appendFile(filename: string, content: string): Promise<void> {
    try {
      await fs.appendFile(path.join(this.basePath, filename), content + '\\n');
    } catch (error) {
      throw new BotError(ErrorCode.MEMORY_WRITE_ERROR, \`Failed to append to \${filename}\`);
    }
  }

  async logDailyEvent(event: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const timestamp = new Date().toISOString();
    await this.appendFile(\`daily/\${today}.md\`, \`[\${timestamp}] \${event}\`);
  }
}
`;

// ============================================================================
// 4. MEMORY MANAGER
// ============================================================================

const memoryManager = `/**
 * Memory Manager - Orchestrates all 5 memory layers
 */

import { MemoryFileStore } from './filestore';
import { MemoryContext, UserProfile, ToolsContext, BotError } from './types';

export class MemoryManager {
  private fileStore: MemoryFileStore;
  private shortTermMemory: string[] = [];
  private workingMemory: Record<string, unknown> = {};

  constructor(basePath: string) {
    this.fileStore = new MemoryFileStore(basePath);
  }

  async initialize(): Promise<void> {
    await this.fileStore.initialize();
  }

  addShortTermMemory(text: string): void {
    this.shortTermMemory.push(text);
    if (this.shortTermMemory.length > 50) {
      this.shortTermMemory.shift();
    }
  }

  addWorkingMemory(key: string, value: unknown): void {
    this.workingMemory[key] = value;
  }

  async getMemoryContext(): Promise<MemoryContext> {
    return {
      shortTerm: this.shortTermMemory.slice(-10).join('\\n') || '(No history)',
      working: this.workingMemory,
      relevantMemory: await this.getRelevantLongTermMemory(),
      userProfile: await this.loadUserProfile(),
      toolsContext: await this.loadToolsContext(),
    };
  }

  async logDailyEvent(event: string): Promise<void> {
    await this.fileStore.logDailyEvent(event);
  }

  private async getRelevantLongTermMemory(): Promise<string> {
    try {
      const memory = await this.fileStore.readFile('MEMORY.md');
      return memory.substring(0, 2000);
    } catch {
      return '(Memory not loaded)';
    }
  }

  private async loadUserProfile(): Promise<UserProfile> {
    return {
      name: 'User',
      timezone: 'UTC',
      language: 'English',
      preferredGroups: [],
      customReminders: {},
    };
  }

  private async loadToolsContext(): Promise<ToolsContext> {
    return {
      availableTools: ['telegram', 'github', 'notion', 'schedule'],
      apiStatus: { telegram: true, github: !!process.env.GITHUB_TOKEN },
      lastSyncTimestamp: {},
    };
  }
}
`;

// ============================================================================
// 5. RAG MODULE
// ============================================================================

const rag = `/**
 * RAG Module - Vector store and semantic search
 */

import { RagQuery, RagResult, BotError, ErrorCode } from './types';

export class RAGManager {
  private chromaPath: string;

  constructor(chromaPath: string) {
    this.chromaPath = chromaPath;
  }

  async initialize(): Promise<void> {
    // Initialize Chroma connection
    console.log(\`RAG initialized with: \${this.chromaPath}\`);
  }

  async indexMessage(
    groupId: string,
    messageId: string,
    authorId: string,
    content: string,
    authorName: string
  ): Promise<void> {
    // Index message with embeddings
    console.log(\`Indexed: \${messageId} from \${authorName}\`);
  }

  async queryMessages(query: RagQuery): Promise<RagResult[]> {
    // Search for similar messages
    console.log(\`Searching for: \${query.query} in \${query.groupId}\`);
    return [];
  }

  async indexGroupMessages(groupId: string, messages: any[]): Promise<void> {
    for (const msg of messages) {
      await this.indexMessage(
        groupId,
        msg.id,
        msg.authorId,
        msg.content,
        msg.authorName
      );
    }
  }
}
`;

// ============================================================================
// WRITE ALL FILES
// ============================================================================

writeFile('src/types.ts', types);
writeFile('src/config.ts', config);
writeFile('src/memory/filestore.ts', memoryFileStore);
writeFile('src/memory/index.ts', memoryManager);
writeFile('src/rag/index.ts', rag);

// ============================================================================
// PLACEHOLDER FILES
// ============================================================================

writeFile('src/agent/index.ts', '// Agent implementation (placeholder)\\nexport {};');
writeFile('src/tools/base.ts', '// Tool base class (placeholder)\\nexport {};');
writeFile('src/tools/telegram.ts', '// Telegram tool (placeholder)\\nexport {};');
writeFile('src/tools/github.ts', '// GitHub tool (placeholder)\\nexport {};');
writeFile('src/tools/notion.ts', '// Notion tool (placeholder)\\nexport {};');
writeFile('src/scheduler/index.ts', '// Scheduler (placeholder)\\nexport {};');
writeFile('src/telegram/client.ts', '// Telegram client (placeholder)\\nexport {};');
writeFile('src/index.ts', 'console.log(\"Tclaw Bot initialized\");');

// Data directories
writeFile('data/memory/.gitkeep', '');
writeFile('data/rag/.gitkeep', '');
writeFile('data/state/.gitkeep', '');

console.log('\\n✓✓✓ ALL SOURCE FILES GENERATED! ✓✓✓');
console.log('\\nNext steps:');
console.log('1. npm install');
console.log('2. npm run build');
console.log('3. Create .env file (copy from .env.example)');
console.log('4. npm run dev');
`;

writeFile('build-project.js', buildScript);

console.log('\n✓ Project builder created!');
console.log('✓ Run: node build-project.js');
