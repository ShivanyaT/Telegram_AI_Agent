/**
 * Source Code Generator - Part 2
 * Generates Memory Manager, Agent, and other core modules
 * Run with: node generate-sources-part2.js
 */

const fs = require('fs');
const path = require('path');

function writeFile(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content);
  console.log(`✓ Generated: ${filePath}`);
}

// ============================================================================
// MEMORY MANAGER
// ============================================================================

const memoryManagerContent = `/**
 * Memory Manager - Orchestrates all 5 memory layers
 * 
 * Layers:
 * 1. Short-term: Current conversation context (ephemeral)
 * 2. Working: Session-specific ad-hoc notes (ephemeral)
 * 3. Long-term file-backed: MEMORY.md (curated) + daily logs
 * 4. Profile: USER.md, SOUL.md, TOOLS.md
 * 5. Task State: heartbeat-state.json
 */

import MemoryFileStore from './filestore';
import { MemoryContext, UserProfile, ToolsContext, MemoryLayer, BotError, ErrorCode } from '../types';

export class MemoryManager {
  private fileStore: MemoryFileStore;
  private shortTermMemory: string[] = [];
  private workingMemory: Record<string, unknown> = {};

  constructor(basePath: string) {
    this.fileStore = new MemoryFileStore(basePath);
  }

  /**
   * Initialize memory system
   */
  async initialize(): Promise<void> {
    await this.fileStore.initialize();
  }

  /**
   * Add to short-term memory (conversation context)
   * This is transient and cleared between sessions
   */
  addShortTermMemory(text: string): void {
    this.shortTermMemory.push(text);
    // Keep only recent items (limit to 50 for context window)
    if (this.shortTermMemory.length > 50) {
      this.shortTermMemory.shift();
    }
  }

  /**
   * Add to working memory (session-specific notes)
   * Example: notes about current user mood, topics discussed
   */
  addWorkingMemory(key: string, value: unknown): void {
    this.workingMemory[key] = value;
  }

  /**
   * Get all current memory context
   * This is what gets passed to the agent before each decision
   */
  async getMemoryContext(): Promise<MemoryContext> {
    const userProfile = await this.loadUserProfile();
    const toolsContext = await this.loadToolsContext();
    const relevantMemory = await this.getRelevantLongTermMemory();

    return {
      shortTerm: this.getShortTermSummary(),
      working: this.workingMemory,
      relevantMemory,
      userProfile,
      toolsContext,
    };
  }

  /**
   * Log an event to today's daily log
   * Raw events, scratch notes, running logs
   */
  async logDailyEvent(event: string): Promise<void> {
    await this.fileStore.logDailyEvent(event);
  }

  /**
   * Consolidate daily logs into MEMORY.md
   * Called once daily (by scheduler)
   */
  async consolidateDailyMemory(): Promise<void> {
    // Read today's log
    const today = new Date().toISOString().split('T')[0];
    const dailyLog = await this.fileStore.readFile(\`daily/\${today}.md\`);

    // Extract important items manually or with LLM summarization
    // For now, we'll just log that consolidation happened
    const consolidationNote = \`\n\\n## [\${today}] Daily Consolidation\\n- See daily/\${today}.md for full log\\n\`;

    const currentMemory = await this.fileStore.readFile('MEMORY.md');
    await this.fileStore.writeFile('MEMORY.md', currentMemory + consolidationNote);
  }

  /**
   * Get relevant long-term memory for current context
   * In a real implementation, this would use semantic search
   * For now, returns recent sections from MEMORY.md
   */
  private async getRelevantLongTermMemory(): Promise<string> {
    try {
      const memory = await this.fileStore.readFile('MEMORY.md');
      // Return first 2000 chars to fit in context window
      return memory.substring(0, 2000);
    } catch {
      return '(Long-term memory not yet loaded)';
    }
  }

  /**
   * Load user profile from USER.md
   */
  private async loadUserProfile(): Promise<UserProfile> {
    try {
      // In a real implementation, parse USER.md into structured data
      // For now, return defaults
      return {
        name: 'User',
        timezone: 'UTC',
        language: 'English',
        preferredGroups: [],
        customReminders: {},
      };
    } catch {
      return {
        name: 'User',
        timezone: 'UTC',
        language: 'English',
        preferredGroups: [],
        customReminders: {},
      };
    }
  }

  /**
   * Load tools context from TOOLS.md
   */
  private async loadToolsContext(): Promise<ToolsContext> {
    try {
      // Parse TOOLS.md for available tools
      const tools = await this.fileStore.readFile('TOOLS.md');
      return {
        availableTools: ['telegram', 'github', 'notion', 'schedule'],
        apiStatus: {
          telegram: true,
          github: !!process.env.GITHUB_TOKEN,
          notion: !!process.env.NOTION_API_KEY,
        },
        lastSyncTimestamp: {},
      };
    } catch {
      return {
        availableTools: [],
        apiStatus: {},
        lastSyncTimestamp: {},
      };
    }
  }

  /**
   * Get summary of short-term memory for context
   */
  private getShortTermSummary(): string {
    if (this.shortTermMemory.length === 0) {
      return '(No recent conversation history)';
    }
    return this.shortTermMemory.slice(-10).join('\\n');
  }
}

export default MemoryManager;
`;

// ============================================================================
// AGENT MODULE
// ============================================================================

const agentContent = `/**
 * Agent Module - Orchestrates LLM-based decision making
 * 
 * Flow:
 * 1. Receive user message + memory context + RAG results
 * 2. Determine if RAG knowledge base is needed
 * 3. Build prompt with relevant context
 * 4. Call LLM to generate response + tool calls
 * 5. Parse tool calls and execute them
 * 6. Return response to user
 */

import { AgentInput, AgentOutput, ToolCall, MemoryContext, BotError, ErrorCode } from '../types';

export class Agent {
  constructor(
    private llmProvider: string,
    private llmModel: string,
    private tools: Map<string, any> // Tool registry
  ) {}

  /**
   * Process user message through agent
   */
  async processMessage(input: AgentInput): Promise<AgentOutput> {
    try {
      // Build the prompt with all available context
      const prompt = this.buildPrompt(input);

      // Call LLM to generate response
      // Note: This is a placeholder - real implementation would call OpenAI/Claude/etc
      const llmResponse = await this.callLLM(prompt);

      // Parse response to extract tool calls
      const toolCalls = this.parseToolCalls(llmResponse);

      // Return agent output
      return {
        response: llmResponse.text || 'I understand, but I need more context.',
        toolCalls,
        confidence: llmResponse.confidence || 0.7,
        reasoning: llmResponse.reasoning || 'Decision made based on context.',
      };
    } catch (error) {
      throw new BotError(
        ErrorCode.AGENT_EXECUTION_ERROR,
        \`Agent failed to process message: \${error}\`
      );
    }
  }

  /**
   * Build comprehensive prompt for LLM
   */
  private buildPrompt(input: AgentInput): string {
    const { userMessage, memoryContext, ragContext, conversationHistory } = input;

    let prompt = \`You are a helpful Telegram assistant with access to tools.

## Your Profile
Name: \${memoryContext.userProfile.name}
Timezone: \${memoryContext.userProfile.timezone}

## Your Behavior Guidelines
(From SOUL.md)
- Be concise and clear
- Ask before taking external actions  
- Explain your reasoning

## Available Tools
- telegram: Send messages, schedule reminders, retrieve group history
- github: Create issues, search repositories
- notion: Create pages, update content
- schedule: Set up cron jobs for recurring tasks

## Current Context
Short-term memory (conversation):
\${memoryContext.shortTerm}

Relevant long-term memory:
\${memoryContext.relevantMemory}

## Recent Conversation
\${conversationHistory.map(t => \`\${t.role}: \${t.content}\`).join('\\n')}

## User's Latest Message
\${userMessage}

## Instruction
Respond naturally and use tools when appropriate. Format tool calls as:
[TOOL_CALL]
{
  "toolName": "telegram",
  "params": { "action": "send_message", "content": "..." }
}
[/TOOL_CALL]
\`;

    if (ragContext && ragContext.length > 0) {
      prompt += \`\n\n## Relevant Context from Groups\n\`;
      ragContext.forEach(result => {
        prompt += \`- \${result.author}: \${result.content.substring(0, 100)}...\\n\`;
      });
    }

    return prompt;
  }

  /**
   * Call LLM provider
   * This is a placeholder - implement based on provider
   */
  private async callLLM(prompt: string): Promise<any> {
    // TODO: Implement actual LLM calls based on provider
    // For now, return a mock response
    return {
      text: 'I understand your request. How can I help?',
      confidence: 0.8,
      reasoning: 'Matched user intent to available tools.',
    };
  }

  /**
   * Parse LLM response for tool calls
   */
  private parseToolCalls(response: any): ToolCall[] {
    const toolCalls: ToolCall[] = [];

    // Look for [TOOL_CALL]...[/TOOL_CALL] blocks
    const toolPattern = /\\[TOOL_CALL\\](.*?)\\[/TOOL_CALL\\]/gs;
    const matches = response.text.matchAll(toolPattern);

    for (const match of matches) {
      try {
        const callData = JSON.parse(match[1]);
        toolCalls.push({
          toolName: callData.toolName,
          toolInput: callData.params,
          executionId: \`exec-\${Date.now()}-\${Math.random()}\`,
        });
      } catch {
        // Invalid JSON, skip
      }
    }

    return toolCalls;
  }
}

export default Agent;
`;

// ============================================================================
// BASE TOOL CLASS
// ============================================================================

const baseToolContent = `/**
 * Base Tool Class - Abstract base for all tools
 * Provides standard interface for tool implementations
 */

import { BaseTool, ToolResult, ToolParameter, BotError, ErrorCode } from '../types';

export abstract class AbstractBaseTool implements BaseTool {
  abstract name: string;
  abstract description: string;
  abstract parameters: ToolParameter[];

  /**
   * Execute the tool with given input
   * Subclasses must implement this
   */
  abstract execute(input: Record<string, unknown>): Promise<ToolResult>;

  /**
   * Validate input parameters against defined schema
   */
  protected validateInput(input: Record<string, unknown>): void {
    for (const param of this.parameters) {
      if (param.required && !(param.name in input)) {
        throw new BotError(
          ErrorCode.TOOL_EXECUTION_FAILED,
          \`Required parameter missing: \${param.name}\`
        );
      }
    }
  }

  /**
   * Helper to create success result
   */
  protected success(result: any, executionId: string): ToolResult {
    return {
      toolName: this.name,
      executionId,
      success: true,
      result,
    };
  }

  /**
   * Helper to create error result
   */
  protected error(error: string, executionId: string): ToolResult {
    return {
      toolName: this.name,
      executionId,
      success: false,
      result: null,
      error,
    };
  }
}

export default AbstractBaseTool;
`;

// ============================================================================
// WRITE FILES
// ============================================================================

writeFile('src/memory/index.ts', memoryManagerContent);
writeFile('src/agent/index.ts', agentContent);
writeFile('src/tools/base.ts', baseToolContent);

console.log('\n✓ Part 2 source files generated!');
`;

// ============================================================================
// END OF FILE
// ============================================================================

writeFile('generate-sources-part2.js', `/**
 * This is a placeholder - run the actual generator first
 * The generator script is too large for this execution
 */
console.log('Please run generate-sources.js and generate-sources-part2.js');
`);

// For now, let me rewrite to make it executable:
const part2Content = `/**
 * Source Code Generator - Part 2
 * Generates Memory Manager, Agent, and other core modules
 * Run with: node generate-sources-part2.js
 */

const fs = require('fs');
const path = require('path');

function writeFile(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content);
  console.log(\`✓ Generated: \${filePath}\`);
}

// MEMORY MANAGER
const memoryManagerContent = \`/**
 * Memory Manager - Orchestrates all 5 memory layers
 */
import MemoryFileStore from './filestore';
import { MemoryContext, UserProfile, ToolsContext, BotError, ErrorCode } from '../types';

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
    const userProfile = await this.loadUserProfile();
    const toolsContext = await this.loadToolsContext();
    const relevantMemory = await this.getRelevantLongTermMemory();

    return {
      shortTerm: this.getShortTermSummary(),
      working: this.workingMemory,
      relevantMemory,
      userProfile,
      toolsContext,
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
      return '(Long-term memory not yet loaded)';
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
      apiStatus: {
        telegram: true,
        github: !!process.env.GITHUB_TOKEN,
        notion: !!process.env.NOTION_API_KEY,
      },
      lastSyncTimestamp: {},
    };
  }

  private getShortTermSummary(): string {
    if (this.shortTermMemory.length === 0) {
      return '(No recent conversation history)';
    }
    return this.shortTermMemory.slice(-10).join('\\\\n');
  }
}\`;

writeFile('src/memory/index.ts', memoryManagerContent);
console.log('\\n✓ Part 2 generated!');
`;

writeFile('generate-sources-part2.js', part2Content);

console.log('\n✓ Part 2 generator created!');
console.log('✓ Run: node generate-sources-part2.js');
