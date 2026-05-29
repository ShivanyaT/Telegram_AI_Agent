/**
 * TELEGRAM BOT - Bot client and message handler
 * Saved as src/bot.ts
 * 
 * Handles:
 * - Bot initialization and polling
 * - Message reception and routing
 * - Command parsing
 * - Group event handling
 * - Tool execution coordination
 */

import TelegramBot, { Message } from 'node-telegram-bot-api';
import { v4 as uuidv4 } from 'uuid';
import { AgentInput, BotError, ErrorCode } from './types';
import Agent from './agent';
import MemoryManager from './memory';
import RAGManager from './rag';
import Scheduler from './scheduler';
import {
  TelegramTool,
  GitHubTool,
  NotionTool,
  AbstractTool,
} from './tools';

/**
 * TelegramBotClient - Main bot interface
 */
export class TelegramBotClient {
  private bot: TelegramBot;
  private agent: Agent;
  private memory: MemoryManager;
  private rag: RAGManager;
  private scheduler: Scheduler;
  private tools: Map<string, AbstractTool> = new Map();
  private botId: string;

  constructor(
    token: string,
    agent: Agent,
    memory: MemoryManager,
    rag: RAGManager,
    scheduler: Scheduler
  ) {
    this.bot = new TelegramBot(token, { polling: true });
    this.agent = agent;
    this.memory = memory;
    this.rag = rag;
    this.scheduler = scheduler;
    this.botId = uuidv4();

    // Initialize tools
    this.registerTools();
  }

  /**
   * Initialize bot - set up handlers
   */
  async initialize(): Promise<void> {
    try {
      const me = await this.bot.getMe();
      console.log(`[Bot] Connected as: @${me.username}`);

      this.setupHandlers();
      console.log('[Bot] Bot initialized successfully');
    } catch (error) {
      throw new BotError(
        ErrorCode.BOT_ERROR,
        `Failed to initialize bot: ${error}`
      );
    }
  }

  /**
   * Register available tools
   */
  private registerTools(): void {
    this.tools.set('telegram', new TelegramTool());
    this.tools.set('github', new GitHubTool());
    this.tools.set('notion', new NotionTool());

    console.log(
      `[Bot] Registered ${this.tools.size} tools: ${Array.from(this.tools.keys()).join(', ')}`
    );
  }

  /**
   * Set up message and event handlers
   */
  private setupHandlers(): void {
    // Handle text messages
    this.bot.on('message', async (msg: TelegramBot.Message) => {
      try {
        await this.handleMessage(msg);
      } catch (error) {
        console.error('[Bot] Error handling message:', error);
        this.sendErrorResponse(msg.chat.id, error as Error);
      }
    });

    // Handle commands
    this.bot.onText(/^\/start/, (msg: TelegramBot.Message) => this.handleStart(msg));
    this.bot.onText(/^\/help/, (msg: TelegramBot.Message) => this.handleHelp(msg));
    this.bot.onText(/^\/status/, (msg: TelegramBot.Message) => this.handleStatus(msg));
    this.bot.onText(/^\/schedule/, (msg: TelegramBot.Message) => this.handleSchedule(msg));

    console.log('[Bot] Message handlers registered');
  }

  /**
   * Main message handler
   */
  private async handleMessage(msg: TelegramBot.Message): Promise<void> {
    const { chat, text, from, message_id } = msg;

    // Skip if not text message
    if (!text || !from) return;

    // Log to memory
    await this.memory.addShortTermMemory(
      `[${from.username || from.first_name}] ${text}`
    );

    console.log(`[Bot] Message from ${from.first_name}: ${text.substring(0, 50)}`);

    // Build agent input
    const agentInput: AgentInput = {
      userMessage: text,
      conversationHistory: [], // TODO: Load conversation history
      memoryContext: await this.memory.getMemoryContext(),
      ragContext: [], // TODO: Query RAG if needed
      currentGroupId: chat.id.toString(),
    };

    // Process with agent
    const agentOutput = await this.agent.processMessage(agentInput);

    // Send response
    await this.bot.sendMessage(chat.id, agentOutput.response);

    // Log to daily memory
    await this.memory.logDailyEvent(`User: ${text} | Bot: ${agentOutput.response}`);

    // Execute tool calls if any
    for (const toolCall of agentOutput.toolCalls) {
      try {
        const tool = this.tools.get(toolCall.toolName);
        if (!tool) {
          console.warn(`[Bot] Unknown tool: ${toolCall.toolName}`);
          continue;
        }

        const result = await tool.execute(toolCall.toolInput);
        console.log(`[Bot] Tool execution: ${toolCall.toolName} - Success: ${result.success}`);

        if (result.result) {
          // Optionally send tool result to user
          const resultText = JSON.stringify(result.result, null, 2);
          if (resultText.length < 1000) {
            await this.bot.sendMessage(chat.id, `Result:\n\`\`\`\n${resultText}\n\`\`\``);
          }
        }
      } catch (error) {
        console.error('[Bot] Tool execution error:', error);
      }
    }
  }

  /**
   * /start command handler
   */
  private async handleStart(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const text = `Welcome to Tclaw Bot! 🤖

I can help you with:
• 📝 Summarize group messages
• ⏰ Schedule reminders
• 📅 Post daily updates
• 🐛 Create GitHub issues
• 📌 Create Notion summaries

Type /help for more information.`;

    await this.bot.sendMessage(chatId, text);

    // Log to memory
    await this.memory.logDailyEvent(`User started bot in chat ${chatId}`);
  }

  /**
   * /help command handler
   */
  private async handleHelp(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const text = `📚 Available Commands:

/start - Welcome message
/status - Bot and system status
/schedule <time> <message> - Schedule a message
/help - This help message

💬 Natural Language Examples:
"Get messages from the last 24 hours"
"Schedule a reminder for 5 minutes"
"Create a GitHub issue about this"
"Make a Notion page summarizing this"

Just send me a message and I'll help!`;

    await this.bot.sendMessage(chatId, text);
  }

  /**
   * /status command handler
   */
  private async handleStatus(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const jobs = this.scheduler.getJobs();

    const text = `🤖 System Status:

Bot ID: ${this.botId}
Connected: ✓
Memory System: ✓
RAG System: ${(await this.rag.getStats()).totalMessages > 0 ? '✓' : 'Empty'}
Tools: ${this.tools.size} registered
Scheduled Jobs: ${jobs.length}`;

    await this.bot.sendMessage(chatId, text);
  }

  /**
   * /schedule command handler
   */
  private async handleSchedule(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const text = msg.text || '';

    // Parse schedule command
    // Example: /schedule 10:00 Good morning!
    const parts = text.split(' ');
    if (parts.length < 3) {
      await this.bot.sendMessage(chatId, 'Usage: /schedule <time> <message>');
      return;
    }

    const time = parts[1];
    const message = parts.slice(2).join(' ');

    // TODO: Parse time and schedule message
    await this.bot.sendMessage(chatId, `Scheduled: "${message}" at ${time}`);

    await this.memory.logDailyEvent(`User scheduled: "${message}" at ${time}`);
  }

  /**
   * Send error response
   */
  private async sendErrorResponse(chatId: number, error: Error): Promise<void> {
    const text = `⚠️ Error: ${error.message}\n\nTry again or type /help for assistance.`;

    try {
      await this.bot.sendMessage(chatId, text);
    } catch (e) {
      console.error('[Bot] Failed to send error response:', e);
    }
  }

  /**
   * Shutdown bot gracefully
   */
  async shutdown(): Promise<void> {
    console.log('[Bot] Shutting down...');

    try {
      this.bot.stopPolling();
      this.scheduler.stopAll();
      console.log('[Bot] Shutdown complete');
    } catch (error) {
      console.error('[Bot] Error during shutdown:', error);
    }
  }

  /**
   * Send a message to a specific chat
   * (Exposed for scheduler/tools to use)
   */
  async sendMessage(chatId: number | string, text: string): Promise<void> {
    await this.bot.sendMessage(chatId, text);
  }

  /**
   * Send a message to a specific group
   */
  async sendToGroup(groupId: string, text: string): Promise<void> {
    const numericId = parseInt(groupId, 10);
    if (!isNaN(numericId)) {
      await this.bot.sendMessage(numericId, text);
    }
  }
}

export default TelegramBotClient;
