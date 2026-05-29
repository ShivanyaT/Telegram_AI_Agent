/**
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
  BOT_ERROR = 'BOT_ERROR',
  MESSAGE_NOT_FOUND = 'MESSAGE_NOT_FOUND',
  CONFIG_MISSING = 'CONFIG_MISSING',
  CONFIG_INVALID = 'CONFIG_INVALID',
}
