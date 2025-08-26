// Performance utilities for optimization

// Debounce function for search and input optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function for scroll and resize events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Batch DOM operations
export function batchDOMUpdates(callback: () => void): Promise<void> {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      callback();
      resolve();
    });
  });
}

// Memory usage monitoring
export class MemoryMonitor {
  private static instance: MemoryMonitor;
  private memoryCheckInterval?: NodeJS.Timeout;

  static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor();
    }
    return MemoryMonitor.instance;
  }

  startMonitoring(intervalMs: number = 30000): void {
    if (this.memoryCheckInterval) return;

    this.memoryCheckInterval = setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const used = memory.usedJSHeapSize;
        const total = memory.totalJSHeapSize;
        const limit = memory.jsHeapSizeLimit;

        console.log('Memory Usage:', {
          used: `${Math.round(used / 1024 / 1024)}MB`,
          total: `${Math.round(total / 1024 / 1024)}MB`,
          limit: `${Math.round(limit / 1024 / 1024)}MB`,
          percentage: `${Math.round((used / limit) * 100)}%`
        });

        // Warning if memory usage is high
        if (used / limit > 0.8) {
          console.warn('High memory usage detected!');
        }
      }
    }, intervalMs);
  }

  stopMonitoring(): void {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = undefined;
    }
  }
}

// Image optimization utilities
export const ImageOptimizer = {
  // Convert image to WebP format if supported
  toWebP: (canvas: HTMLCanvasElement, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            resolve(url);
          }
        },
        'image/webp',
        quality
      );
    });
  },

  // Resize image while maintaining aspect ratio
  resize: (
    file: File, 
    maxWidth: number, 
    maxHeight: number, 
    quality: number = 0.8
  ): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        const { width, height } = img;
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        
        canvas.width = width * ratio;
        canvas.height = height * ratio;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const optimizedFile = new File([blob], file.name, {
                type: 'image/webp',
                lastModified: Date.now()
              });
              resolve(optimizedFile);
            }
          },
          'image/webp',
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }
};

// Bundle size optimization tracking
export const BundleAnalyzer = {
  trackComponentLoad: (componentName: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Component loaded: ${componentName}`);
    }
  },

  trackChunkLoad: (chunkName: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Chunk loaded: ${chunkName}`);
    }
  }
};

// Performance metrics collection
export class PerformanceTracker {
  private metrics: Map<string, number> = new Map();

  startTimer(name: string): void {
    this.metrics.set(name, performance.now());
  }

  endTimer(name: string): number {
    const startTime = this.metrics.get(name);
    if (startTime === undefined) {
      console.warn(`Timer "${name}" was not started`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.metrics.delete(name);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${name}: ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }

  measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.startTimer(name);
    return fn().finally(() => {
      this.endTimer(name);
    });
  }
}

// Global performance tracker instance
export const performanceTracker = new PerformanceTracker();