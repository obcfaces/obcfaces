// Comprehensive monitoring and analytics system

interface ErrorReport {
  message: string;
  stack?: string;
  url: string;
  userId?: string;
  timestamp: number;
  userAgent: string;
  additionalInfo?: Record<string, any>;
}

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  userId?: string;
  metadata?: Record<string, any>;
}

interface UserAction {
  action: string;
  target: string;
  userId?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

class MonitoringService {
  private static instance: MonitoringService;
  private errorQueue: ErrorReport[] = [];
  private metricsQueue: PerformanceMetric[] = [];
  private actionsQueue: UserAction[] = [];
  private userId?: string;

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  // Error tracking
  trackError(error: Error, additionalInfo?: Record<string, any>): void {
    const errorReport: ErrorReport = {
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      userId: this.userId,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      additionalInfo
    };

    this.errorQueue.push(errorReport);
    console.error('Error tracked:', errorReport);

    // Send to backend immediately for critical errors
    if (this.isCriticalError(error)) {
      this.flushErrors();
    }
  }

  // Performance tracking
  trackPerformance(name: string, value: number, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      userId: this.userId,
      metadata
    };

    this.metricsQueue.push(metric);

    // Auto-flush if queue gets too large
    if (this.metricsQueue.length > 50) {
      this.flushMetrics();
    }
  }

  // User action tracking
  trackUserAction(action: string, target: string, metadata?: Record<string, any>): void {
    const userAction: UserAction = {
      action,
      target,
      userId: this.userId,
      timestamp: Date.now(),
      metadata
    };

    this.actionsQueue.push(userAction);

    // Auto-flush if queue gets too large
    if (this.actionsQueue.length > 100) {
      this.flushActions();
    }
  }

  // Core Web Vitals tracking
  trackCoreWebVitals(): void {
    // First Contentful Paint
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
            this.trackPerformance('FCP', entry.startTime, { type: 'core-web-vital' });
          }
          
          if (entry.entryType === 'largest-contentful-paint') {
            this.trackPerformance('LCP', entry.startTime, { type: 'core-web-vital' });
          }
        }
      });

      observer.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
    }

    // Cumulative Layout Shift
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
      });

      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // Report CLS on page unload
      window.addEventListener('beforeunload', () => {
        this.trackPerformance('CLS', clsValue, { type: 'core-web-vital' });
      });
    }

    // First Input Delay
    if ('PerformanceObserver' in window) {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.trackPerformance('FID', (entry as any).processingStart - entry.startTime, { 
            type: 'core-web-vital' 
          });
        }
      });

      fidObserver.observe({ entryTypes: ['first-input'] });
    }
  }

  // Resource monitoring
  trackResourceLoading(): void {
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resource = entry as PerformanceResourceTiming;
          
          this.trackPerformance('resource-load-time', resource.duration, {
            type: 'resource',
            name: resource.name,
            size: resource.transferSize,
            cached: resource.transferSize === 0
          });

          // Track slow resources
          if (resource.duration > 1000) {
            this.trackPerformance('slow-resource', resource.duration, {
              type: 'performance-issue',
              name: resource.name,
              size: resource.transferSize
            });
          }
        }
      });

      resourceObserver.observe({ entryTypes: ['resource'] });
    }
  }

  // Memory monitoring
  startMemoryMonitoring(): void {
    setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        this.trackPerformance('memory-usage', memory.usedJSHeapSize, {
          type: 'memory',
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit
        });
      }
    }, 30000); // Check every 30 seconds
  }

  // API call monitoring
  monitorApiCalls(): void {
    const originalFetch = window.fetch;
    
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const startTime = performance.now();
      const url = typeof input === 'string' ? input : input.toString();
      
      try {
        const response = await originalFetch(input, init);
        const duration = performance.now() - startTime;
        
        this.trackPerformance('api-call', duration, {
          type: 'api',
          url,
          status: response.status,
          method: init?.method || 'GET'
        });

        // Track slow API calls
        if (duration > 2000) {
          this.trackPerformance('slow-api-call', duration, {
            type: 'performance-issue',
            url,
            status: response.status
          });
        }

        return response;
      } catch (error) {
        const duration = performance.now() - startTime;
        
        this.trackError(error as Error, {
          type: 'api-error',
          url,
          duration
        });
        
        throw error;
      }
    };
  }

  // Data flushing methods
  private async flushErrors(): Promise<void> {
    if (this.errorQueue.length === 0) return;

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Store errors in Supabase (you'd need to create this table)
      const errors = [...this.errorQueue];
      this.errorQueue = [];

      // For now, just log to console
      console.log('Flushing errors:', errors);
      
      // TODO: Send to your analytics endpoint
      // await supabase.from('error_logs').insert(errors);
    } catch (error) {
      console.error('Failed to flush errors:', error);
      // Put errors back in queue
      this.errorQueue.unshift(...this.errorQueue);
    }
  }

  private async flushMetrics(): Promise<void> {
    if (this.metricsQueue.length === 0) return;

    try {
      const metrics = [...this.metricsQueue];
      this.metricsQueue = [];

      // For now, just log to console
      console.log('Flushing metrics:', metrics);
      
      // TODO: Send to your analytics endpoint
    } catch (error) {
      console.error('Failed to flush metrics:', error);
    }
  }

  private async flushActions(): Promise<void> {
    if (this.actionsQueue.length === 0) return;

    try {
      const actions = [...this.actionsQueue];
      this.actionsQueue = [];

      // For now, just log to console
      console.log('Flushing actions:', actions);
      
      // TODO: Send to your analytics endpoint
    } catch (error) {
      console.error('Failed to flush actions:', error);
    }
  }

  private isCriticalError(error: Error): boolean {
    const criticalKeywords = ['chunk', 'network', 'security', 'authentication'];
    return criticalKeywords.some(keyword => 
      error.message.toLowerCase().includes(keyword)
    );
  }

  // Initialization
  init(): void {
    // Set up global error handler
    window.addEventListener('error', (event) => {
      this.trackError(event.error, {
        type: 'global-error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Set up unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(event.reason, {
        type: 'unhandled-promise-rejection'
      });
    });

    // Start monitoring
    this.trackCoreWebVitals();
    this.trackResourceLoading();
    this.startMemoryMonitoring();
    this.monitorApiCalls();

    // Flush data periodically
    setInterval(() => {
      this.flushErrors();
      this.flushMetrics();
      this.flushActions();
    }, 60000); // Flush every minute

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flushErrors();
      this.flushMetrics();
      this.flushActions();
    });
  }
}

// Export singleton instance
export const monitoring = MonitoringService.getInstance();

// Convenience functions
export const trackError = (error: Error, info?: Record<string, any>) => 
  monitoring.trackError(error, info);

export const trackPerformance = (name: string, value: number, metadata?: Record<string, any>) => 
  monitoring.trackPerformance(name, value, metadata);

export const trackUserAction = (action: string, target: string, metadata?: Record<string, any>) => 
  monitoring.trackUserAction(action, target, metadata);

export const setUserId = (userId: string) => 
  monitoring.setUserId(userId);