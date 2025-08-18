// Performance monitoring utility
class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private enabled: boolean = __DEV__;

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Start timing an operation
  startTimer(operation: string): string {
    if (!this.enabled) return '';
    
    const id = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = performance.now();
    
    // Store the start time
    this.metrics.set(id, [startTime]);
    
    if (__DEV__) {
      console.log(`⏱️ Started timing: ${operation} (${id})`);
    }
    
    return id;
  }

  // End timing an operation
  endTimer(id: string): number {
    if (!this.enabled || !id) return 0;
    
    const endTime = performance.now();
    const startTime = this.metrics.get(id)?.[0];
    
    if (!startTime) {
      if (__DEV__) {
        console.warn(`⏱️ Timer not found: ${id}`);
      }
      return 0;
    }
    
    const duration = endTime - startTime;
    
    // Store the duration
    this.metrics.set(id, [startTime, endTime, duration]);
    
    if (__DEV__) {
      console.log(`⏱️ Completed: ${id} took ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }

  // Get average time for an operation type
  getAverageTime(operation: string): number {
    if (!this.enabled) return 0;
    
    const times: number[] = [];
    
    for (const [id, metrics] of this.metrics.entries()) {
      if (id.startsWith(operation) && metrics.length >= 3) {
        times.push(metrics[2]);
      }
    }
    
    if (times.length === 0) return 0;
    
    const average = times.reduce((sum, time) => sum + time, 0) / times.length;
    return average;
  }

  // Get slow operations (above threshold)
  getSlowOperations(threshold: number = 1000): Array<{id: string, duration: number}> {
    if (!this.enabled) return [];
    
    const slow: Array<{id: string, duration: number}> = [];
    
    for (const [id, metrics] of this.metrics.entries()) {
      if (metrics.length >= 3 && metrics[2] > threshold) {
        slow.push({ id, duration: metrics[2] });
      }
    }
    
    return slow.sort((a, b) => b.duration - a.duration);
  }

  // Clear old metrics (older than 1 hour)
  clearOldMetrics(): void {
    if (!this.enabled) return;
    
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const toDelete: string[] = [];
    
    for (const [id, metrics] of this.metrics.entries()) {
      const startTime = metrics[0];
      if (startTime < oneHourAgo) {
        toDelete.push(id);
      }
    }
    
    toDelete.forEach(id => this.metrics.delete(id));
    
    if (__DEV__ && toDelete.length > 0) {
      console.log(`🧹 Cleared ${toDelete.length} old performance metrics`);
    }
  }

  // Enable/disable monitoring
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  // Get summary of all metrics
  getSummary(): Record<string, any> {
    if (!this.enabled) return {};
    
    const summary: Record<string, any> = {};
    const operationGroups: Record<string, number[]> = {};
    
    for (const [id, metrics] of this.metrics.entries()) {
      const operation = id.split('_')[0];
      if (metrics.length >= 3) {
        if (!operationGroups[operation]) {
          operationGroups[operation] = [];
        }
        operationGroups[operation].push(metrics[2]);
      }
    }
    
    for (const [operation, times] of Object.entries(operationGroups)) {
      const average = times.reduce((sum, time) => sum + time, 0) / times.length;
      const min = Math.min(...times);
      const max = Math.max(...times);
      
      summary[operation] = {
        count: times.length,
        average: average.toFixed(2),
        min: min.toFixed(2),
        max: max.toFixed(2),
        total: times.reduce((sum, time) => sum + time, 0).toFixed(2)
      };
    }
    
    return summary;
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Auto-cleanup old metrics every 10 minutes
if (__DEV__) {
  setInterval(() => {
    performanceMonitor.clearOldMetrics();
  }, 10 * 60 * 1000);
}

// Performance decorator for functions
export function measurePerformance(operation: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const timerId = performanceMonitor.startTimer(operation);
      try {
        const result = await method.apply(this, args);
        performanceMonitor.endTimer(timerId);
        return result;
      } catch (error) {
        performanceMonitor.endTimer(timerId);
        throw error;
      }
    };
  };
}

// Performance wrapper for async functions
export function withPerformance<T extends (...args: any[]) => Promise<any>>(
  operation: string,
  fn: T
): T {
  return (async (...args: any[]) => {
    const timerId = performanceMonitor.startTimer(operation);
    try {
      const result = await fn(...args);
      performanceMonitor.endTimer(timerId);
      return result;
    } catch (error) {
      performanceMonitor.endTimer(timerId);
      throw error;
    }
  }) as T;
} 