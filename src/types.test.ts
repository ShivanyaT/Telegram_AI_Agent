/**
 * Basic type system tests
 */

import {
  MemoryContext,
  AgentInput,
  AgentOutput,
  BotError,
  ErrorCode,
} from './types';

describe('Type System', () => {
  describe('BotError', () => {
    it('should create BotError with code and message', () => {
      const error = new BotError(ErrorCode.BOT_ERROR, 'Test error');
      expect(error.code).toBe(ErrorCode.BOT_ERROR);
      expect(error.message).toBe('Test error');
    });

    it('should create BotError with context', () => {
      const error = new BotError(
        ErrorCode.AGENT_EXECUTION_ERROR,
        'Agent failed',
        { input: 'test' }
      );
      expect(error.code).toBe(ErrorCode.AGENT_EXECUTION_ERROR);
      expect(error.message).toBe('Agent failed');
      expect(error.context).toEqual({ input: 'test' });
    });
  });

  describe('AgentInput/Output', () => {
    it('should create valid AgentInput', () => {
      const input: AgentInput = {
        userMessage: 'Hello bot',
        conversationHistory: [],
        memoryContext: {
          shortTerm: 'Recent conversation',
          working: {},
          relevantMemory: 'Long-term memory',
          userProfile: {
            name: 'User',
            timezone: 'UTC',
            language: 'English',
            preferredGroups: [],
            customReminders: {},
          },
          toolsContext: {
            availableTools: ['telegram'],
            apiStatus: { telegram: true },
            lastSyncTimestamp: {},
          },
        },
        currentGroupId: '12345',
      };

      expect(input.userMessage).toBe('Hello bot');
      expect(input.conversationHistory).toEqual([]);
    });

    it('should create valid AgentOutput', () => {
      const output: AgentOutput = {
        response: 'Hello user',
        toolCalls: [],
        confidence: 0.9,
        reasoning: 'Matched intent',
      };

      expect(output.response).toBe('Hello user');
      expect(output.confidence).toBe(0.9);
    });
  });
});
