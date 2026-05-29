/**
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
        `Unsupported LLM provider: ${config.llmProvider}`
      );
  }
}

export default { loadConfig, getLLMConfig };
