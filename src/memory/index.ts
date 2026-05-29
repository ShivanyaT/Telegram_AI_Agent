/**
 * Memory Manager - Main entry point for the 5-layer memory system
 * Wraps MemoryFileStore and provides high-level memory operations
 */

import { MemoryFileStore } from './filestore';
import { BotConfig } from '../types';

export class MemoryManager {
  private store: MemoryFileStore;

  // Short-term memory: current conversation context
  private conversationHistory: Array<{ role: string; content: string }> = [];

  // Working memory: temporary session notes
  private sessionNotes: string[] = [];

  constructor(config: BotConfig) {
    this.store = new MemoryFileStore(config.memory.dataPath);
  }

  /**
   * Initialize memory system - creates files/folders if they don't exist
   */
  async initialize(): Promise<void> {
    await this.store.initialize();
  }

  /**
   * Add a message to short-term conversation history
   */
  addToConversation(role: string, content: string): void {
    this.conversationHistory.push({ role, content });
  }

  /**
   * Get current conversation history (short-term memory)
   */
  getConversationHistory() {
    return this.conversationHistory;
  }

  /**
   * Clear conversation history (e.g. on new session)
   */
  clearConversation(): void {
    this.conversationHistory = [];
  }

  /**
   * Add a working memory note for this session
   */
  addSessionNote(note: string): void {
    this.sessionNotes.push(note);
  }

  /**
   * Read long-term memory file (MEMORY.md)
   */
  async readLongTermMemory(): Promise<string> {
    return this.store.readFile('MEMORY.md');
  }

  /**
   * Read user profile (USER.md)
   */
  async readUserProfile(): Promise<string> {
    return this.store.readFile('USER.md');
  }

  /**
   * Read bot behavior guidelines (SOUL.md)
   */
  async readSoul(): Promise<string> {
    return this.store.readFile('SOUL.md');
  }

  /**
   * Log an event to today's daily log
   */
  async logEvent(event: string): Promise<void> {
    await this.store.logDailyEvent(event);
  }

  /**
   * Build full context to pass to the agent
   */
  async buildAgentContext(): Promise<string> {
    const longTerm = await this.readLongTermMemory();
    const user = await this.readUserProfile();

    return `
## Long-Term Memory
${longTerm}

## User Profile
${user}

## Session Notes
${this.sessionNotes.join('\n') || 'None'}
    `.trim();
  }
}

export default MemoryManager;