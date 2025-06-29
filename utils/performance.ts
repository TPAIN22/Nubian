interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  mountTime: number;
  timestamp: number;
}

interface NetworkMetrics {
  url: string;
  method: string;
  duration: number;
  status: number;
  timestamp: number;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private networkMetrics: NetworkMetrics[] = [];
  private isEnabled: boolean = __DEV__;

  private constructor() {
    this.setupPerformanceObserver();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private setupPerformanceObserver() {
    if (!this.isEnabled) return;

    try {
      // استخدام performance API المتاح
      if (typeof performance !== 'undefined') {
        console.log('Performance monitoring enabled');
      }
    } catch (error) {
      console.warn('Performance observer not supported:', error);
    }
  }

  private handlePerformanceEntry(entry: PerformanceEntry) {
    if (entry.entryType === 'measure') {
      this.metrics.push({
        componentName: entry.name,
        renderTime: entry.duration,
        mountTime: entry.startTime,
        timestamp: Date.now(),
      });
    }
  }

  // مراقبة أداء المكونات
  measureComponent(componentName: string, callback: () => void) {
    if (!this.isEnabled) {
      callback();
      return;
    }

    const startTime = Date.now();
    callback();
    const endTime = Date.now();

    this.metrics.push({
      componentName,
      renderTime: endTime - startTime,
      mountTime: startTime,
      timestamp: Date.now(),
    });
  }

  // مراقبة طلبات الشبكة
  measureNetworkRequest(url: string, method: string, startTime: number, endTime: number, status: number) {
    if (!this.isEnabled) return;

    this.networkMetrics.push({
      url,
      method,
      duration: endTime - startTime,
      status,
      timestamp: Date.now(),
    });
  }

  // الحصول على إحصائيات الأداء
  getPerformanceStats() {
    if (this.metrics.length === 0) return null;

    const avgRenderTime = this.metrics.reduce((sum, metric) => sum + metric.renderTime, 0) / this.metrics.length;
    const slowestComponent = this.metrics.reduce((slowest, metric) => 
      metric.renderTime > slowest.renderTime ? metric : slowest
    );

    return {
      totalComponents: this.metrics.length,
      averageRenderTime: avgRenderTime,
      slowestComponent: {
        name: slowestComponent.componentName,
        renderTime: slowestComponent.renderTime,
      },
      recentMetrics: this.metrics.slice(-10), // آخر 10 قياسات
    };
  }

  // الحصول على إحصائيات الشبكة
  getNetworkStats() {
    if (this.networkMetrics.length === 0) return null;

    const avgDuration = this.networkMetrics.reduce((sum, metric) => sum + metric.duration, 0) / this.networkMetrics.length;
    const slowestRequest = this.networkMetrics.reduce((slowest, metric) => 
      metric.duration > slowest.duration ? metric : slowest
    );

    return {
      totalRequests: this.networkMetrics.length,
      averageDuration: avgDuration,
      slowestRequest: {
        url: slowestRequest.url,
        method: slowestRequest.method,
        duration: slowestRequest.duration,
      },
      recentRequests: this.networkMetrics.slice(-10), // آخر 10 طلبات
    };
  }

  // تنظيف البيانات القديمة
  cleanup() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    this.metrics = this.metrics.filter(metric => metric.timestamp > oneHourAgo);
    this.networkMetrics = this.networkMetrics.filter(metric => metric.timestamp > oneHourAgo);
  }

  // تفعيل/إلغاء تفعيل المراقبة
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  // تصدير البيانات للتشخيص
  exportData() {
    return {
      performance: this.getPerformanceStats(),
      network: this.getNetworkStats(),
      rawMetrics: this.metrics,
      rawNetworkMetrics: this.networkMetrics,
    };
  }
}

// Hook لمراقبة أداء المكونات
export const usePerformanceMonitor = (componentName: string) => {
  const monitor = PerformanceMonitor.getInstance();

  const measureRender = (callback: () => void) => {
    monitor.measureComponent(componentName, callback);
  };

  return { measureRender };
};

// Hook لمراقبة طلبات الشبكة
export const useNetworkMonitor = () => {
  const monitor = PerformanceMonitor.getInstance();

  const measureRequest = (url: string, method: string, startTime: number, endTime: number, status: number) => {
    monitor.measureNetworkRequest(url, method, startTime, endTime, status);
  };

  return { measureRequest };
};

export default PerformanceMonitor.getInstance(); 