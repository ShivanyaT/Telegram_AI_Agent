/**
 * TCLAW TELEGRAM BOT - MASTER SOURCE FILE GENERATOR
 * This script generates all TypeScript source files
 * Run with: node generate-sources.js
 */

const fs = require('fs');
const path = require('path');

// Helper to create a file
function writeFile(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content);
  console.log(`✓ Generated: ${filePath}`);
}

// ============================================================================
// TYPES MODULE
// ============================================================================

const typesContent = `/**
 * Shared TypeScript types and interfaces for the Telegram Agent Bot.
 * These are the foundational type definitions used across all modules.
 */

// ============================================================================
// MEMORY TYPES
// ============================================================================

export interface MemoryLayer {
  type: 'short_term' | 'working' | 'long_term' | 'profile' | 'task_state';
  content: string | Record<string, unknown>;
  timestamp: Date;
  expiresAt?: Date;
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

// ============================================================================
// AGENT TYPES
// ============================================================================

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

// ============================================================================
// RAG TYPES
// ============================================================================

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

// ============================================================================
// TOOL TYPES
// ============================================================================

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
  editedAt?: Date;
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
  linkedMessageId?: string;
}

export interface NotionPage {
  id: string;
  title: string;
  content: string;
  properties: Record<string, unknown>;
  linkedGroupId?: string;
}

// ============================================================================
// SCHEDULER TYPES
// ============================================================================

export interface CronJob {
  id: string;
  name: string;
  cronExpression: string;
  handler: string;
  lastRun?: Date;
  nextRun?: Date;
  active: boolean;
}

export interface HeartbeatState {
  jobId: string;
  lastExecutedAt: Date;
  nextScheduledAt: Date;
  failureCount: number;
  successCount: number;
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export interface BotConfig {
  llmProvider: 'openai' | 'anthropic' | 'local';
  llmModel: string;
  telegram: {
    botToken: string;
    webhookUrl?: string;
    pollingTimeout?: number;
  };
  tools: {
    github?: {
      token: string;
      owner: string;
      repo: string;
    };
    notion?: {
      apiKey: string;
      databaseId: string;
    };
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

// ============================================================================
// ERROR HANDLING
// ============================================================================

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
  MESSAGE_NOT_FOUND = 'MESSAGE_NOT_FOUND',
  CONFIG_MISSING = 'CONFIG_MISSING',
  CONFIG_INVALID = 'CONFIG_INVALID',
}
`;

// ============================================================================
// CONFIG MODULE
// ============================================================================

const configContent = `/**
 * Configuration Module - Loads and validates environment configuration
 * This provides a config-driven approach for easy provider swaps
 */

import dotenv from 'dotenv';
import { BotConfig, ErrorCode, BotError } from './types';

dotenv.config();

/**
 * Load and validate all configuration from environment variables.
 */
export function loadConfig(): BotConfig {
  const config: BotConfig = {
    llmProvider: (process.env.LLM_PROVIDER || 'openai') as any,
    llmModel: process.env.OPENAI_MODEL || 'gpt-4',

    telegram: {
      botToken: process.env.TELEGRAM_BOT_TOKEN || '',
      webhookUrl: process.env.TELEGRAM_WEBHOOK_URL,
      pollingTimeout: parseInt(process.env.TELEGRAM_POLLING_TIMEOUT || '30'),
    },

    tools: {
      github:
        process.env.GITHUB_TOKEN && process.env.GITHUB_REPO_OWNER
          ? {
              token: process.env.GITHUB_TOKEN,
              owner: process.env.GITHUB_REPO_OWNER,
              repo: process.env.GITHUB_REPO_NAME || 'main-repo',
            }
          : undefined,
      notion:
        process.env.NOTION_API_KEY && process.env.NOTION_DATABASE_ID
          ? {
              apiKey: process.env.NOTION_API_KEY,
              databaseId: process.env.NOTION_DATABASE_ID,
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

  // Validate critical configurations
  if (!config.telegram.botToken) {
    throw new BotError(
      ErrorCode.CONFIG_MISSING,
      'TELEGRAM_BOT_TOKEN environment variable is required'
    );
  }

  return config;
}

/**
 * Get LLM-specific configuration based on provider
 */
export function getLLMConfig(config: BotConfig): Record<string, string> {
  switch (config.llmProvider) {
    case 'openai':
      return {
        apiKey: process.env.OPENAI_API_KEY || '',
        model: process.env.OPENAI_MODEL || 'gpt-4',
        baseURL: process.env.OPENAI_API_BASE || 'https://api.openai.com/v1',
      };

    case 'anthropic':
      return {
        apiKey: process.env.ANTHROPIC_API_KEY || '',
        model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
      };

    case 'local':
      return {
        baseURL: process.env.LOCAL_LLM_URL || 'http://localhost:8000',
        model: process.env.LOCAL_LLM_MODEL || 'llama2',
      };

    default:
      throw new BotError(
        ErrorCode.CONFIG_INVALID,
        \`Unsupported LLM provider: \${config.llmProvider}\`
      );
  }
}

export default { loadConfig, getLLMConfig };
`;

// ============================================================================
// MEMORY MODULE - FILE STORE
// ============================================================================

const memoryFileStoreContent = `/**
 * Memory File Store - Handles reading/writing memory files
 * Provides atomic operations with recovery for reliability
 */

import fs from 'fs/promises';
import path from 'path';
import { BotError, ErrorCode } from '../types';

export class MemoryFileStore {
  constructor(private basePath: string) {}

  /**
   * Initialize memory directory and create default files if they don't exist
   */
  async initialize(): Promise<void> {
    try {
      // Ensure base directory exists
      await fs.mkdir(this.basePath, { recursive: true });

      // Create daily logs directory
      const logsDir = path.join(this.basePath, 'daily');
      await fs.mkdir(logsDir, { recursive: true });

      // Initialize default files if they don't exist
      const defaultFiles = {
        'MEMORY.md': this.getDefaultMemoryTemplate(),
        'USER.md': this.getDefaultUserTemplate(),
        'SOUL.md': this.getDefaultSoulTemplate(),
        'TOOLS.md': this.getDefaultToolsTemplate(),
      };

      for (const [filename, content] of Object.entries(defaultFiles)) {
        const filePath = path.join(this.basePath, filename);
        try {
          await fs.stat(filePath);
        } catch {
          // File doesn't exist, create it
          await fs.writeFile(filePath, content);
        }
      }
    } catch (error) {
      throw new BotError(
        ErrorCode.MEMORY_READ_ERROR,
        \`Failed to initialize memory store: \${error}\`
      );
    }
  }

  /**
   * Read a memory file with error handling
   */
  async readFile(filename: string): Promise<string> {
    try {
      const filePath = path.join(this.basePath, filename);
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      throw new BotError(
        ErrorCode.MEMORY_READ_ERROR,
        \`Failed to read \${filename}: \${error}\`
      );
    }
  }

  /**
   * Write to memory file atomically
   */
  async writeFile(filename: string, content: string): Promise<void> {
    try {
      const filePath = path.join(this.basePath, filename);
      const tempPath = \`\${filePath}.tmp\`;

      // Write to temp file first
      await fs.writeFile(tempPath, content, 'utf-8');

      // Atomic move (rename)
      await fs.rename(tempPath, filePath);
    } catch (error) {
      throw new BotError(
        ErrorCode.MEMORY_WRITE_ERROR,
        \`Failed to write \${filename}: \${error}\`
      );
    }
  }

  /**
   * Append to a file (for daily logs)
   */
  async appendFile(filename: string, content: string): Promise<void> {
    try {
      const filePath = path.join(this.basePath, filename);
      await fs.appendFile(filePath, content + '\\n', 'utf-8');
    } catch (error) {
      throw new BotError(
        ErrorCode.MEMORY_WRITE_ERROR,
        \`Failed to append to \${filename}: \${error}\`
      );
    }
  }

  /**
   * Get today's daily log filename
   */
  private getTodayLogFilename(): string {
    const today = new Date().toISOString().split('T')[0];
    return \`daily/\${today}.md\`;
  }

  /**
   * Log an event to today's daily log
   */
  async logDailyEvent(event: string): Promise<void> {
    const filename = this.getTodayLogFilename();
    const timestamp = new Date().toISOString();
    await this.appendFile(filename, \`[\${timestamp}] \${event}\`);
  }

  // ========================================================================
  // DEFAULT TEMPLATES
  // ========================================================================

  private getDefaultMemoryTemplate(): string {
    return \`# Long-Term Memory

## Decisions & Preferences

### Communication
- Preferred summary style: bullet points
- Timezone: UTC
- Language: English

## Recurring Preferences

- Schedule reminders for deadlines proactively
- Ask before creating external content
- Prefer concise technical explanations

## Important Commitments

(None yet)

## GitHub Monitoring

(None yet)

## Notion Pages

(None yet)
\`;
  }

  private getDefaultUserTemplate(): string {
    return \`# User Profile

## Identity
- Name: User
- Timezone: UTC
- Language: English

## Preferred Groups/Channels
- (List groups being monitored)

## Custom Reminders
- (List recurring reminders)

## Accounts
- GitHub: (username)
- Notion: (workspace)
\`;
  }

  private getDefaultSoulTemplate(): string {
    return \`# Bot Behavior Guidelines

## Communication Style
- Be concise and clear
- Ask before taking external actions
- Summarize complex topics into bullet points

## Privacy & Safety
- Never share sensitive data externally
- Keep personal memory (MEMORY.md) private
- Respect group chat contexts

## Problem-Solving
- Think step-by-step
- Explain reasoning
- Suggest alternatives before deciding
\`;
  }

  private getDefaultToolsTemplate(): string {
    return \`# Tools & Environment Configuration

## API Status
- Telegram: Configured (bot token set)
- GitHub: (Needs token)
- Notion: (Needs API key)

## Chroma Vector Store
- Path: ./data/rag
- Status: Local (not initialized yet)

## Devices & Services
- (List relevant device names, endpoints, etc.)
\`;
  }
}

export default MemoryFileStore;
`;

// ============================================================================
// WRITE ALL FILES
// ============================================================================

writeFile('src/types.ts', typesContent);
writeFile('src/config.ts', configContent);
writeFile('src/memory/filestore.ts', memoryFileStoreContent);

console.log('\n✓ All source files generated successfully!');
console.log('✓ Next steps: npm install && npm run build');
