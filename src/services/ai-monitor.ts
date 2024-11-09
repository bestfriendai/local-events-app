interface PerformanceMetrics {
  service: 'perplexity' | 'claude';
  startTime: number;
  endTime: number;
  success: boolean;
  error?: string;
}

class AIMonitor {
  private static instance: AIMonitor;
  private metrics: PerformanceMetrics[] = [];
  private errorCounts: Record<string, number> = {};

  private constructor() {}

  static getInstance(): AIMonitor {
    if (!AIMonitor.instance) {
      AIMonitor.instance = new AIMonitor();
    }
    return AIMonitor.instance;
  }

  startRequest(service: 'perplexity' | 'claude'): number {
    return Date.now();
  }

  endRequest(service: 'perplexity' | 'claude', startTime: number, success: boolean, error?: string) {
    const endTime = Date.now();
    
    this.metrics.push({
      service,
      startTime,
      endTime,
      success,
      error
    });

    if (!success) {
      this.errorCounts[service] = (this.errorCounts[service] || 0) + 1;
    }

    // Log performance metrics
    console.log(`AI Request Metrics:`, {
      service,
      duration: endTime - startTime,
      success,
      error
    });
  }

  getErrorRate(service: 'perplexity' | 'claude'): number {
    const totalRequests = this.metrics.filter(m => m.service === service).length;
    const errors = this.errorCounts[service] || 0;
    return totalRequests > 0 ? errors / totalRequests : 0;
  }

  getAverageLatency(service: 'perplexity' | 'claude'): number {
    const serviceMetrics = this.metrics.filter(m => m.service === service);
    if (serviceMetrics.length === 0) return 0;

    const totalLatency = serviceMetrics.reduce((sum, m) => sum + (m.endTime - m.startTime), 0);
    return totalLatency / serviceMetrics.length;
  }
}

export const aiMonitor = AIMonitor.getInstance();