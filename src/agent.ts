/**
 * TCLAW AGENT - Core Agent Orchestration
 * 
 * The Agent is the decision-making engine of the bot.
 * Saved as src/agent.ts (combined to work around directory limitations)
 */

import { v4 as uuidv4 } from 'uuid';
import {
  AgentInput,
  AgentOutput,
  ToolCall,
  BotError,
  ErrorCode,
} from './types';

/**
 * Agent class - orchestrates LLM calls and tool execution
 */
export class Agent {
  private name = 'tclaw-agent';
  private llmProvider: string;
  private llmModel: string;

  constructor(llmProvider: string, llmModel: string) {
    this.llmProvider = llmProvider;
    this.llmModel = llmModel;
  }

  /**
   * Main entry point - process user message through agent
   */
  async processMessage(input: AgentInput): Promise<AgentOutput> {
    try {
      // 1. Build comprehensive prompt with all context
      const prompt = this.buildPrompt(input);

      // 2. Call LLM (placeholder - implement based on provider)
      const llmResponse = await this.callLLM(prompt);

      // 3. Parse response to extract tool calls
      const toolCalls = this.parseToolCalls(llmResponse.text);

      // 4. Return structured agent output
      return {
        response: llmResponse.text,
        toolCalls,
        confidence: llmResponse.confidence || 0.7,
        reasoning: llmResponse.reasoning || 'Agent decision made based on context.',
      };
    } catch (error) {
      throw new BotError(
        ErrorCode.AGENT_EXECUTION_ERROR,
        `Agent failed to process message: ${error}`
      );
    }
  }

  /**
   * Build comprehensive prompt for LLM
   */
  private buildPrompt(input: AgentInput): string {
    const {
      userMessage,
      conversationHistory,
      memoryContext,
      ragContext,
      currentGroupId,
    } = input;

    let prompt = `# TCLAW Agent Decision Prompt

## Your Identity
You are an intelligent Telegram bot assistant called "Tclaw".

Name: ${memoryContext.userProfile.name}
Timezone: ${memoryContext.userProfile.timezone}
Language: ${memoryContext.userProfile.language}

## Your Behavior Guidelines
${memoryContext.relevantMemory}

## Available Tools
${this.formatAvailableTools(memoryContext.toolsContext.availableTools)}

### Conversation History
${this.formatConversationHistory(conversationHistory)}

### User's Current Message
\`\`\`
${userMessage}
\`\`\`

## Instructions
1. Understand the user's intent
2. Consult relevant memory and preferences
3. Decide which tools (if any) to use
4. Respond naturally and helpfully

## Your Response`;

    // Add RAG context if available
    if (ragContext && ragContext.length > 0) {
      prompt += `\n\n## Relevant Context from Groups\n`;
      ragContext.forEach((result, index) => {
        prompt += `\n${index + 1}. From ${result.author}:\n"${result.content}"\n`;
      });
    }

    return prompt;
  }

  /**
   * Call the LLM provider (placeholder)
   */
  private async callLLM(prompt: string): Promise<any> {
    console.log(`[Agent] Processing with ${this.llmProvider}/${this.llmModel}...`);

    // Mock response for now
    return {
      text: "I understand your request. How can I help you today?",
      confidence: 0.8,
      reasoning: 'Matched user intent to available context.',
    };
  }

  /**
   * Parse LLM response to extract tool calls
   */
  private parseToolCalls(responseText: string): ToolCall[] {
    const toolCalls: ToolCall[] = [];
    const toolPattern = /\[TOOL_CALL\]([\s\S]*?)\[\/TOOL_CALL\]/g;
    let match;

    while ((match = toolPattern.exec(responseText)) !== null) {
      try {
        const jsonStr = match[1].trim();
        const toolData = JSON.parse(jsonStr);

        if (toolData.toolName) {
          toolCalls.push({
            toolName: toolData.toolName,
            toolInput: toolData.params || toolData,
            executionId: `exec-${uuidv4()}`,
          });
        }
      } catch (error) {
        // Invalid JSON, skip
      }
    }

    return toolCalls;
  }

  /**
   * Format available tools for prompt
   */
  private formatAvailableTools(tools: string[]): string {
    if (tools.length === 0) return '(No tools available)';

    const toolDescriptions: Record<string, string> = {
      telegram: 'Send messages, retrieve history, schedule reminders',
      github: 'Create issues, search repos, manage projects',
      notion: 'Create pages, update content, organize databases',
      schedule: 'Set up cron jobs, schedule recurring tasks',
    };

    return tools
      .map((tool) => `• ${tool}: ${toolDescriptions[tool] || 'Custom tool'}`)
      .join('\n');
  }

  /**
   * Format conversation history
   */
  private formatConversationHistory(history: any[]): string {
    if (history.length === 0) return '(No previous history)';

    return history
      .slice(-5)
      .map((turn) => `${turn.role === 'user' ? 'User' : 'Bot'}: ${turn.content}`)
      .join('\n');
  }
}

export default Agent;
