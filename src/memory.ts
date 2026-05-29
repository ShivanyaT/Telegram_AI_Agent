/**
 * MEMORY MANAGER - Orchestrates all 5 memory layers
 * Saved as src/memory.ts (combined module)
 * 
 * 5 Layers:
 * 1. Short-term (RAM, session) - chat history
 * 2. Working (RAM, session) - ad-hoc notes
 * 3. Long-term curated (MEMORY.md) - decisions & preferences
 * 4. Long-term logs (daily/*.md) - raw events
 * 5. Profile (USER.md, SOUL.md, TOOLS.md) - identity & behavior
 */

import path from 'path';
import {
  MemoryContext,
  UserProfile,
  ToolsContext,
  BotError,
  ErrorCode,
} from './types';
import MemoryFileStore from './memory/filestore';

/**
 * MemoryManager - Orchestrates all 5 memory layers
 */
export class MemoryManager {
  private fileStore: MemoryFileStore;
  private shortTermMemory: string[] = [];
  private workingMemory: Record<string, unknown> = {};

  constructor(basePath: string) {
    this.fileStore = new MemoryFileStore(basePath);
  }

  /**
   * Initialize memory system - create directories and default files
   */
  async initialize(): Promise<void> {
    await this.fileStore.initialize();
  }

  /**
   * Add to short-term memory (chat history)
   * Ephemeral, cleared on session end
   * Limited to ~50 messages to fit in context window
   */
  addShortTermMemory(text: string): void {
    this.shortTermMemory.push(text);
    // Keep only recent items
    if (this.shortTermMemory.length > 50) {
      this.shortTermMemory.shift();
    }
  }

  /**
   * Add to working memory (session notes)
   * Ephemeral, cleared on session end
   * Example: "User is in EST timezone"
   */
  addWorkingMemory(key: string, value: unknown): void {
    this.workingMemory[key] = value;
  }

  /**
   * Get all memory context
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
   * Log an event to today's daily log (append-only)
   */
  async logDailyEvent(event: string): Promise<void> {
    await this.fileStore.logDailyEvent(event);
  }

  /**
   * Read a memory file (MEMORY.md, USER.md, etc.)
   */
  async readFile(filename: string): Promise<string> {
    return this.fileStore.readFile(filename);
  }

  /**
   * Write to a memory file (for updates)
   */
  async writeFile(filename: string, content: string): Promise<void> {
    return this.fileStore.writeFile(filename, content);
  }

  /**
   * Get relevant long-term memory
   * Reads first 2000 chars of MEMORY.md to fit in context
   */
  private async getRelevantLongTermMemory(): Promise<string> {
    try {
      const memory = await this.fileStore.readFile('MEMORY.md');
      // Return manageable chunk to fit in context window
      return memory.substring(0, 2000);
    } catch {
      return '(Long-term memory not yet loaded)';
    }
  }

  /**
   * Load user profile from USER.md
   * In production, this would parse USER.md into structured data
   */
  private async loadUserProfile(): Promise<UserProfile> {
    try {
      const userMd = await this.fileStore.readFile('USER.md');
      // For now, return defaults (could parse USER.md structure later)
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
      const toolsMd = await this.fileStore.readFile('TOOLS.md');
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
    return this.shortTermMemory.slice(-10).join('\n');
  }

  /**
   * Consolidate daily logs into MEMORY.md (manual process)
   * Called by scheduler daily
   * Human reviews logs, bot helps consolidate into MEMORY.md
   */
  async consolidateDailyMemory(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    try {
      const dailyLog = await this.fileStore.readFile(`daily/${today}.md`);
      const timestamp = new Date().toISOString();

      // Log consolidation event
      const consolidationNote = `\n## [${today}] Daily Consolidation\nReview daily/${today}.md for full log\n`;

      const currentMemory = await this.fileStore.readFile('MEMORY.md');
      await this.fileStore.writeFile('MEMORY.md', currentMemory + consolidationNote);
    } catch (error) {
      console.warn('Consolidation skipped:', error);
    }
  }
}

export default MemoryManager;
