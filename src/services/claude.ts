import { Message } from '../types/chat';
import { Anthropic } from '@anthropic-ai/sdk';
import { validateAPIKey, validateMessages } from './ai-validator';
import { aiMonitor } from './ai-monitor';

export async function getClaudeCompletion(messages: Message[]) {
  const validation = validateAPIKey('claude');
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const messageValidation = validateMessages(messages);
  if (!messageValidation.isValid) {
    throw new Error(messageValidation.error);
  }

  const startTime = aiMonitor.startRequest('claude');

  try {
    const response = await fetch('/.netlify/functions/claude-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "claude-3-opus-20240229",
        max_tokens: 1024,
        messages: messages.map(msg => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
        })),
        system: `You are an AI assistant helping users plan dates and find events. 
        When events are mentioned in your responses, format them like this:

        EVENT_START
        Title: [Event Title]
        Date: [Event Date in MM/DD/YYYY format]
        Time: [Event Time in HH:MM AM/PM format]
        Location: [Full address including venue name, street, city, state]
        Category: [One of: live-music, comedy, sports-games, performing-arts, food-drink, cultural, social, educational, outdoor, special]
        Price: [Price or price range if available]
        Description: [Brief description]
        EVENT_END`
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get response from Claude API');
    }

    const data = await response.json();
    aiMonitor.endRequest('claude', startTime, true);

    return {
      content: data.content[0].text,
      events: [] // Events will be extracted by the existing parser
    };
  } catch (error) {
    aiMonitor.endRequest('claude', startTime, false, error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}