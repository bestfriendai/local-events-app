import { Message } from '../types/chat';

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateAPIKey(service: 'perplexity' | 'claude'): ValidationResult {
  const key = service === 'perplexity' 
    ? import.meta.env.VITE_PERPLEXITY_API_KEY 
    : import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!key) {
    return {
      isValid: false,
      error: `${service} API key is not configured`
    };
  }

  if (service === 'perplexity' && !key.startsWith('pplx-')) {
    return {
      isValid: false,
      error: 'Invalid Perplexity API key format'
    };
  }

  if (service === 'claude' && !key.startsWith('sk-ant-')) {
    return {
      isValid: false,
      error: 'Invalid Claude API key format'
    };
  }

  return { isValid: true };
}

export function validateMessages(messages: Message[]): ValidationResult {
  if (!Array.isArray(messages) || messages.length === 0) {
    return {
      isValid: false,
      error: 'Messages must be a non-empty array'
    };
  }

  const invalidMessage = messages.find(msg => 
    !msg.id || !msg.role || !msg.content ||
    !['user', 'assistant', 'system'].includes(msg.role) || // Added 'system' role
    typeof msg.content !== 'string'
  );

  if (invalidMessage) {
    return {
      isValid: false,
      error: 'Invalid message format'
    };
  }

  return { isValid: true };
}

export function validateDatePlanRequest(params: {
  date?: Date;
  startTime?: string;
  duration?: number;
  budget?: number;
  location?: { latitude: number; longitude: number };
  preferences?: string[];
  transportMode?: 'driving' | 'walking' | 'transit';
}): ValidationResult {
  if (!params.date) {
    return {
      isValid: false,
      error: 'Please select a date'
    };
  }

  if (!params.startTime) {
    return {
      isValid: false,
      error: 'Please select a start time'
    };
  }

  if (!params.duration || params.duration < 2 || params.duration > 12) {
    return {
      isValid: false,
      error: 'Duration must be between 2 and 12 hours'
    };
  }

  if (!params.budget || params.budget < 20 || params.budget > 500) {
    return {
      isValid: false,
      error: 'Budget must be between $20 and $500'
    };
  }

  if (!params.location) {
    return {
      isValid: false,
      error: 'Please select a location'
    };
  }

  if (params.transportMode && !['driving', 'walking', 'transit'].includes(params.transportMode)) {
    return {
      isValid: false,
      error: 'Invalid transport mode'
    };
  }

  return { isValid: true };
}