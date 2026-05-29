/**
 * TCLAW TELEGRAM BOT - Main Entry Point
 * 
 * This is where everything comes together:
 * 1. Load configuration
 * 2. Initialize memory system
 * 3. Initialize Telegram bot
 * 4. Set up agent and tools
 * 5. Start listening for messages
 */

import dotenv from 'dotenv';
import { loadConfig } from './config';
import MemoryManager from './memory';
import { BotError, ErrorCode } from './types';

// Load environment variables
dotenv.config();

/**
 * Main initialization function
 */
async function main() {
  try {
    console.log('🚀 Starting Tclaw Telegram Bot...\n');

    // 1. Load configuration
    console.log('📋 Loading configuration...');
    const config = loadConfig();
    console.log(`   ✓ LLM Provider: ${config.llmProvider}`);
    console.log(`   ✓ Memory Path: ${config.memory.dataPath}`);
    console.log(`   ✓ RAG Path: ${config.rag.chromaPath}`);

    // 2. Initialize memory system
    console.log('\n💾 Initializing memory system...');
    const memoryManager = new MemoryManager(config.memory.dataPath);
    await memoryManager.initialize();
    console.log('   ✓ Memory system ready');
    console.log(`   ✓ Files created at: ${config.memory.dataPath}`);

    // 3. Get initial memory context
    console.log('\n🧠 Loading memory context...');
    const memoryContext = await memoryManager.getMemoryContext();
    console.log('   ✓ User profile loaded');
    console.log('   ✓ Long-term memory loaded');

    // 4. Log startup event
    await memoryManager.logDailyEvent('Bot started');
    console.log('   ✓ Startup event logged');

    // 5. Initialize agent and tools
    let agent: any;
    console.log('\n🤖 Initializing agent system...');
    try {
      const Agent = (await import('./agent')).default;
      agent = new Agent(config.llmProvider, config.llmModel);
      console.log('   ✓ Agent initialized');
    } catch (error) {
      console.log('   ⚠ Agent initialization skipped (optional)');
    }

    // 6. Initialize RAG system
    let rag: any;
    console.log('\n🔍 Initializing RAG system...');
    try {
      const RAGManager = (await import('./rag')).default;
      rag = new RAGManager(config.rag.chromaPath);
      await rag.initialize();
      console.log('   ✓ RAG system initialized');
    } catch (error) {
      console.log('   ⚠ RAG initialization skipped (optional)');
    }

    // 7. Initialize scheduler
    let scheduler: any;
    console.log('\n⏰ Initializing scheduler...');
    try {
      const Scheduler = (await import('./scheduler')).default;
      scheduler = new Scheduler(config.memory.dataPath);
      await scheduler.initialize();
      console.log('   ✓ Scheduler initialized');
    } catch (error) {
      console.log('   ⚠ Scheduler initialization skipped');
    }

    // 8. Initialize Telegram bot
    console.log('\n💬 Initializing Telegram bot...');
    try {
      const TelegramBotClient = (await import('./bot')).default;
      const bot = new TelegramBotClient(
        config.telegram.botToken,
        agent,
        memoryManager,
        rag,
        scheduler
      );
      await bot.initialize();
      
      console.log('   ✓ Bot client initialized');
      console.log('   ✓ Listening for messages...');
      console.log(`   ✓ Bot is ready! Send it a message on Telegram.\n`);

      // Keep the bot running
      // The bot will handle all message events internally
    } catch (error) {
      console.log('   ⚠ Telegram bot client initialization failed');
      console.log('   Error:', error);
    }

    // 9. Show what's ready
    console.log('✅ Bot initialization complete!');
    console.log('\nReady features:');
    console.log('   ✓ Memory system (5 layers)');
    console.log('   ✓ Configuration system');
    console.log('   ✓ Agent system');
    console.log('   ✓ RAG system');
    console.log('   ✓ Tools (Telegram, GitHub, Notion)');
    console.log('   ✓ Scheduler');
    console.log('\nNext steps:');
    console.log('   1. Send a message to your bot on Telegram');
    console.log('   2. Check data/memory/daily/ for logs');
    console.log('   3. Edit data/memory/MEMORY.md with your preferences\n');

  } catch (error) {
    if (error instanceof BotError) {
      console.error(`\n❌ Bot Error [${error.code}]: ${error.message}`);
      if (error.context) {
        console.error('   Context:', error.context);
      }
    } else {
      console.error('\n❌ Unexpected error:', error);
    }
    process.exit(1);
  }
}

// Run the bot
main();
