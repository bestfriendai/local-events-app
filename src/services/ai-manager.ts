import { Message } from '../types/chat';
import { getChatCompletion } from './perplexity';
import { getClaudeCompletion } from './claude';

export class AIManager {
  private currentService: 'perplexity' | 'claude' = 'perplexity';
  private failureCount: Record<'perplexity' | 'claude', number> = {
    perplexity: 0,
    claude: 0
  };
  private retryLimit = 2;

  private async tryService(service: 'perplexity' | 'claude', messages: Message[]) {
    try {
      const response = service === 'perplexity' 
        ? await getChatCompletion(messages)
        : await getClaudeCompletion(messages);
      
      // Reset failure count on success
      this.failureCount[service] = 0;
      return response;
    } catch (error) {
      this.failureCount[service]++;
      throw error;
    }
  }

  private shouldSwitchService(service: 'perplexity' | 'claude'): boolean {
    return this.failureCount[service] >= this.retryLimit;
  }

  private getAlternativeService(): 'perplexity' | 'claude' {
    return this.currentService === 'perplexity' ? 'claude' : 'perplexity';
  }

  async getCompletion(messages: Message[]) {
    // Add system message if not present
    if (!messages.some(m => m.role === 'system')) {
      messages.unshift({
        id: 'system',
        role: 'system',
        content: `You are an AI assistant helping users plan dates and find events. 
        When suggesting events or places, always include specific details like:
        - Full address
        - Date and time
        - Price range
        - Category (e.g., restaurant, entertainment, activity)
        - Brief description
        Format event details consistently for easy parsing.`
      });
    }

    try {
      const response = await this.tryService(this.currentService, messages);
      return response;
    } catch (error) {
      console.error(`${this.currentService} API Error:`, error);

      if (this.shouldSwitchService(this.currentService)) {
        const alternativeService = this.getAlternativeService();
        console.log(`Switching to ${alternativeService}`);
        this.currentService = alternativeService;
        
        try {
          return await this.tryService(alternativeService, messages);
        } catch (alternativeError) {
          console.error(`${alternativeService} API Error:`, alternativeError);
          throw new Error('All AI services failed. Please try again later.');
        }
      }

      throw error;
    }
  }
}