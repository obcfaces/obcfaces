import { useEffect } from 'react';
import { MemoryMonitor, performanceTracker } from '@/utils/performance';

/**
 * Hook для мониторинга производительности компонента
 * Отслеживает время рендеринга и использование памяти
 */
export const usePerformanceMonitor = (componentName: string, enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled || process.env.NODE_ENV !== 'development') return;

    // Запускаем таймер рендеринга
    performanceTracker.startTimer(`${componentName}-mount`);
    
    // Запускаем мониторинг памяти
    const memoryMonitor = MemoryMonitor.getInstance();
    memoryMonitor.startMonitoring(60000); // Проверка каждую минуту

    return () => {
      // Останавливаем таймер при размонтировании
      const duration = performanceTracker.endTimer(`${componentName}-mount`);
      
      if (duration > 1000) {
        console.warn(`⚠️ ${componentName} took ${duration.toFixed(2)}ms to mount (slow!)`);
      } else {
        console.log(`✅ ${componentName} mounted in ${duration.toFixed(2)}ms`);
      }
    };
  }, [componentName, enabled]);

  // Функция для измерения асинхронных операций
  const measureAsync = <T,>(name: string, fn: () => Promise<T>): Promise<T> => {
    if (!enabled || process.env.NODE_ENV !== 'development') {
      return fn();
    }
    return performanceTracker.measureAsync(`${componentName}-${name}`, fn);
  };

  return { measureAsync };
};
