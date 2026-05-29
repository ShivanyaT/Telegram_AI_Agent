/**
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
        `Failed to initialize memory store: ${error}`
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
        `Failed to read ${filename}: ${error}`
      );
    }
  }

  /**
   * Write to memory file atomically
   */
  async writeFile(filename: string, content: string): Promise<void> {
    try {
      const filePath = path.join(this.basePath, filename);
      const tempPath = `${filePath}.tmp`;

      // Write to temp file first
      await fs.writeFile(tempPath, content, 'utf-8');

      // Atomic move (rename)
      await fs.rename(tempPath, filePath);
    } catch (error) {
      throw new BotError(
        ErrorCode.MEMORY_WRITE_ERROR,
        `Failed to write ${filename}: ${error}`
      );
    }
  }

  /**
   * Append to a file (for daily logs)
   */
  async appendFile(filename: string, content: string): Promise<void> {
    try {
      const filePath = path.join(this.basePath, filename);
      await fs.appendFile(filePath, content + '\n', 'utf-8');
    } catch (error) {
      throw new BotError(
        ErrorCode.MEMORY_WRITE_ERROR,
        `Failed to append to ${filename}: ${error}`
      );
    }
  }

  /**
   * Get today's daily log filename
   */
  private getTodayLogFilename(): string {
    const today = new Date().toISOString().split('T')[0];
    return `daily/${today}.md`;
  }

  /**
   * Log an event to today's daily log
   */
  async logDailyEvent(event: string): Promise<void> {
    const filename = this.getTodayLogFilename();
    const timestamp = new Date().toISOString();
    await this.appendFile(filename, `[${timestamp}] ${event}`);
  }

  // ========================================================================
  // DEFAULT TEMPLATES
  // ========================================================================

  private getDefaultMemoryTemplate(): string {
    return `# Long-Term Memory

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
`;
  }

  private getDefaultUserTemplate(): string {
    return `# User Profile

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
`;
  }

  private getDefaultSoulTemplate(): string {
    return `# Bot Behavior Guidelines

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
`;
  }

  private getDefaultToolsTemplate(): string {
    return `# Tools & Environment Configuration

## API Status
- Telegram: Configured (bot token set)
- GitHub: (Needs token)
- Notion: (Needs API key)

## Chroma Vector Store
- Path: ./data/rag
- Status: Local (not initialized yet)

## Devices & Services
- (List relevant device names, endpoints, etc.)
`;
  }
}

export default MemoryFileStore;
