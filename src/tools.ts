/**
 * TOOLS BASE MODULE - Tool implementation framework
 * Saved as src/tools.ts
 * 
 * Provides base classes for:
 * - Telegram tool (send messages, retrieve history)
 * - GitHub tool (create issues)
 * - Notion tool (create pages)
 * - Easy to add more tools
 */
import Scheduler, { JobHandlers } from './scheduler';
import { v4 as uuidv4 } from 'uuid';
import {
  BaseTool,
  ToolParameter,
  ToolResult,
  BotError,
  ErrorCode,
} from './types';

/**
 * Abstract base class for all tools
 * Provides common functionality and validation
 */
export abstract class AbstractTool implements BaseTool {
  abstract name: string;
  abstract description: string;
  abstract parameters: ToolParameter[];

  /**
   * Execute the tool - must be implemented by subclasses
   */
  abstract execute(input: Record<string, unknown>): Promise<ToolResult>;

  /**
   * Validate input parameters
   */
  protected validateInput(input: Record<string, unknown>): string[] {
    const errors: string[] = [];

    for (const param of this.parameters) {
      if (param.required && !(param.name in input)) {
        errors.push(`Required parameter missing: ${param.name}`);
      }

      // Type checking could be added here
      if (param.name in input) {
        const value = input[param.name];
        const actualType = typeof value;

        // Simple type check
        if (
          param.type !== 'array' &&
          param.type !== 'object' &&
          actualType !== param.type
        ) {
          errors.push(
            `Parameter ${param.name} should be ${param.type}, got ${actualType}`
          );
        }
      }
    }

    return errors;
  }

  /**
   * Helper to create success result
   */
  protected success(result: unknown, executionId: string): ToolResult {
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
  protected error(errorMsg: string, executionId: string): ToolResult {
    return {
      toolName: this.name,
      executionId,
      success: false,
      result: null,
      error: errorMsg,
    };
  }
}

/**
 * TELEGRAM TOOL - Send/receive messages, schedule posts
 */
export class TelegramTool extends AbstractTool {
  private scheduler: Scheduler;
  
  constructor(scheduler: Scheduler) {
    super();
    this.scheduler = scheduler;
  }
  name = 'telegram';
  description =
    'Send messages, retrieve group history, schedule reminders, manage Telegram interactions';
  parameters: ToolParameter[] = [
    {
      name: 'action',
      type: 'string',
      description:
        'Action to perform: send_message, retrieve_messages, schedule_message',
      required: true,
    },
    {
      name: 'groupId',
      type: 'string',
      description: 'Telegram group or channel ID',
      required: false,
    },
    {
      name: 'content',
      type: 'string',
      description: 'Message content to send',
      required: false,
    },
    {
      name: 'scheduledFor',
      type: 'string',
      description: 'ISO timestamp for scheduled messages',
      required: false,
    },
  ];

  async execute(input: Record<string, unknown>): Promise<ToolResult> {
    const executionId = uuidv4();

    // Validate input
    const errors = this.validateInput(input);
    if (errors.length > 0) {
      return this.error(errors.join('; '), executionId);
    }

    try {
      const action = input.action as string;

      switch (action) {
        case 'send_message':
          return this.sendMessage(input, executionId);

        case 'retrieve_messages':
          return this.retrieveMessages(input, executionId);

        case 'schedule_message':
        case 'schedule_reminder': // Accept both names
          // Normalize parameter names
          if (input.chat_id && !input.groupId) input.groupId = input.chat_id;
          if (input.message && !input.content) input.content = input.message;
          return this.scheduleMessage(input, executionId);

        default:
          return this.error(`Unknown action: ${action}`, executionId);
      }
    } catch (error) {
      return this.error(`Telegram tool error: ${error}`, executionId);
    }
  }

  private async sendMessage(
    input: Record<string, unknown>,
    executionId: string
  ): Promise<ToolResult> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = input.groupId as string;
    const content = input.content as string;

    if (!chatId || !content) {
      return this.error('groupId and content are required', executionId);
    }

    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: content }),
      }
    );

    const data = await response.json() as any;

    if (!data.ok) {
      return this.error(`Telegram API error: ${data.description}`, executionId);
    }

    return this.success({ messageId: data.result.message_id, sent: true }, executionId);
  }

  private async retrieveMessages(
    input: Record<string, unknown>,
    executionId: string
  ): Promise<ToolResult> {
    // TODO: Implement Telegram message retrieval
    console.log(`[Telegram] Retrieving messages from: ${input.groupId}`);

    return this.success(
      { messages: [], count: 0 },
      executionId
    );
  }

  private async scheduleMessage(
    input: Record<string, unknown>,
    executionId: string
  ): Promise<ToolResult> {
  // Normalize parameter names (LLM uses different names sometimes)
    const groupId = (input.groupId || input.chat_id) as string;
    const content = (input.content || input.message) as string;
    const timeStr = (input.scheduledFor || input.time) as string;

    if (!groupId || !content || !timeStr) {
      return this.error('groupId, content and time are required', executionId);
    }

    // Handle "X seconds" format
    if (timeStr.includes('second')) {
      const seconds = parseInt(timeStr);
      setTimeout(async () => {
        await JobHandlers.postToGroup(groupId, content);
      }, seconds * 1000);
      return this.success({ scheduled: true, method: 'timeout', delay: `${seconds}s` }, executionId);
    }

    // Handle "X minutes" format
    if (timeStr.includes('minute')) {
      const minutes = parseInt(timeStr);
      setTimeout(async () => {
        await JobHandlers.postToGroup(groupId, content);
      }, minutes * 60 * 1000);
      return this.success({ scheduled: true, method: 'timeout', delay: `${minutes}m` }, executionId);
    }

  // Handle HH:MM or ISO timestamp
    const date = new Date(timeStr);
    const mins = date.getMinutes();
    const hrs = date.getHours();
    const cronExpression = `${mins} ${hrs} * * *`;

    await this.scheduler.registerJob(
      `send-message-${executionId}`,
      cronExpression,
      async () => {
        await JobHandlers.postToGroup(groupId, content);
      }
    );

    return this.success({ scheduled: true, method: 'cron', cronExpression }, executionId);
  }
}
/**
 * GITHUB TOOL - Create issues, search repositories
 */
export class GitHubTool extends AbstractTool {
  name = 'github';
  description =
    'Create GitHub issues, search repositories, manage issues and projects';
  parameters: ToolParameter[] = [
    {
      name: 'action',
      type: 'string',
      description: 'Action: create_issue, search_issues, get_issue',
      required: true,
    },
    {
      name: 'repo',
      type: 'string',
      description: 'Repository name (owner/repo)',
      required: false,
    },
    {
      name: 'title',
      type: 'string',
      description: 'Issue title',
      required: false,
    },
    {
      name: 'body',
      type: 'string',
      description: 'Issue description',
      required: false,
    },
    {
      name: 'labels',
      type: 'array',
      description: 'Issue labels',
      required: false,
    },
  ];

  async execute(input: Record<string, unknown>): Promise<ToolResult> {
    const executionId = uuidv4();

    try {
      const action = input.action as string;

      switch (action) {
        case 'create_issue':
          return this.createIssue(input, executionId);

        case 'search_issues':
          return this.searchIssues(input, executionId);

        case 'get_issue':
          return this.getIssue(input, executionId);

        default:
          return this.error(`Unknown action: ${action}`, executionId);
      }
    } catch (error) {
      return this.error(`GitHub tool error: ${error}`, executionId);
    }
  }

  private async createIssue(
    input: Record<string, unknown>,
    executionId: string
  ): Promise<ToolResult> {
    // TODO: Implement GitHub API call
    console.log(`[GitHub] Creating issue: ${input.title}`);

    return this.success(
      { issueNumber: 123, url: 'https://github.com/...' },
      executionId
    );
  }

  private async searchIssues(
    input: Record<string, unknown>,
    executionId: string
  ): Promise<ToolResult> {
    // TODO: Implement issue search
    console.log(`[GitHub] Searching issues in: ${input.repo}`);

    return this.success(
      { issues: [], count: 0 },
      executionId
    );
  }

  private async getIssue(
    input: Record<string, unknown>,
    executionId: string
  ): Promise<ToolResult> {
    // TODO: Implement get issue
    console.log(`[GitHub] Getting issue from: ${input.repo}`);

    return this.success(
      { issue: null },
      executionId
    );
  }
}

/**
 * NOTION TOOL - Create and update pages
 */
export class NotionTool extends AbstractTool {
  name = 'notion';
  description = 'Create Notion pages, update databases, organize content';
  parameters: ToolParameter[] = [
    {
      name: 'action',
      type: 'string',
      description: 'Action: create_page, update_page, query_database',
      required: true,
    },
    {
      name: 'databaseId',
      type: 'string',
      description: 'Notion database ID',
      required: false,
    },
    {
      name: 'title',
      type: 'string',
      description: 'Page title',
      required: false,
    },
    {
      name: 'content',
      type: 'string',
      description: 'Page content',
      required: false,
    },
  ];

  async execute(input: Record<string, unknown>): Promise<ToolResult> {
    const executionId = uuidv4();

    try {
      const action = input.action as string;

      switch (action) {
        case 'create_page':
          return this.createPage(input, executionId);

        case 'update_page':
          return this.updatePage(input, executionId);

        case 'query_database':
          return this.queryDatabase(input, executionId);

        default:
          return this.error(`Unknown action: ${action}`, executionId);
      }
    } catch (error) {
      return this.error(`Notion tool error: ${error}`, executionId);
    }
  }

  private async createPage(
    input: Record<string, unknown>,
    executionId: string
  ): Promise<ToolResult> {
    // TODO: Implement Notion API call
    console.log(`[Notion] Creating page: ${input.title}`);

    return this.success(
      { pageId: uuidv4(), url: 'https://notion.so/...' },
      executionId
    );
  }

  private async updatePage(
    input: Record<string, unknown>,
    executionId: string
  ): Promise<ToolResult> {
    // TODO: Implement page update
    console.log(`[Notion] Updating page`);

    return this.success(
      { updated: true },
      executionId
    );
  }

  private async queryDatabase(
    input: Record<string, unknown>,
    executionId: string
  ): Promise<ToolResult> {
    // TODO: Implement database query
    console.log(`[Notion] Querying database: ${input.databaseId}`);

    return this.success(
      { results: [] },
      executionId
    );
  }
}
