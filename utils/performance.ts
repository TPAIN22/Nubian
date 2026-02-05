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

// ============================================================================
// TAP-TO-NAVIGATE LATENCY TRACKING
// ============================================================================

interface NavigationTiming {
  tapTime: number;
  navigationCallTime?: number;
  screenMountTime?: number;
  dataFetchStartTime?: number;
  dataFetchEndTime?: number;
  firstContentfulPaint?: number;
  productId: string;
}

const navigationTimings: Map<string, NavigationTiming> = new Map();

/**
 * Start tracking a product tap
 */
export function markTapStart(productId: string): void {
  const timing: NavigationTiming = {
    tapTime: performance.now(),
    productId,
  };
  navigationTimings.set(productId, timing);
  
  if (__DEV__) {
    console.log(`[PERF] 🟢 TAP START: ${productId} at ${timing.tapTime.toFixed(2)}ms`);
  }
}

/**
 * Mark when navigation.push is called
 */
export function markNavigationCall(productId: string): void {
  const timing = navigationTimings.get(productId);
  if (timing) {
    timing.navigationCallTime = performance.now();
    const delta = timing.navigationCallTime - timing.tapTime;
    
    if (__DEV__) {
      console.log(`[PERF] 🔵 NAVIGATION CALL: ${productId} | tap->nav: ${delta.toFixed(2)}ms`);
      if (delta > 100) {
        console.warn(`[PERF] ⚠️ SLOW: Tap to navigation took ${delta.toFixed(2)}ms (>100ms)`);
      }
    }
  }
}

/**
 * Mark when ProductDetails screen mounts (first render)
 */
export function markScreenMount(productId: string): void {
  const timing = navigationTimings.get(productId);
  if (timing) {
    timing.screenMountTime = performance.now();
    const fromTap = timing.screenMountTime - timing.tapTime;
    const fromNav = timing.navigationCallTime 
      ? timing.screenMountTime - timing.navigationCallTime 
      : 0;
    
    if (__DEV__) {
      console.log(`[PERF] 🟣 SCREEN MOUNT: ${productId} | tap->mount: ${fromTap.toFixed(2)}ms | nav->mount: ${fromNav.toFixed(2)}ms`);
    }
  }
}

/**
 * Mark data fetch start
 */
export function markFetchStart(productId: string): void {
  const timing = navigationTimings.get(productId);
  if (timing) {
    timing.dataFetchStartTime = performance.now();
    
    if (__DEV__) {
      const fromMount = timing.screenMountTime 
        ? timing.dataFetchStartTime - timing.screenMountTime 
        : 0;
      console.log(`[PERF] 🟡 FETCH START: ${productId} | mount->fetch: ${fromMount.toFixed(2)}ms`);
    }
  }
}

/**
 * Mark data fetch end
 */
export function markFetchEnd(productId: string): void {
  const timing = navigationTimings.get(productId);
  if (timing) {
    timing.dataFetchEndTime = performance.now();
    const fetchDuration = timing.dataFetchStartTime 
      ? timing.dataFetchEndTime - timing.dataFetchStartTime 
      : 0;
    
    if (__DEV__) {
      console.log(`[PERF] 🟢 FETCH END: ${productId} | fetch duration: ${fetchDuration.toFixed(2)}ms`);
    }
  }
}

/**
 * Mark first contentful paint (when UI is ready)
 */
export function markContentReady(productId: string): void {
  const timing = navigationTimings.get(productId);
  if (timing) {
    timing.firstContentfulPaint = performance.now();
    const totalTime = timing.firstContentfulPaint - timing.tapTime;
    
    if (__DEV__) {
      console.log(`[PERF] ✅ CONTENT READY: ${productId}`);
      console.log(`[PERF] ═══════════════════════════════════════`);
      console.log(`[PERF] TOTAL TAP-TO-CONTENT: ${totalTime.toFixed(2)}ms`);
      console.log(`[PERF] Breakdown:`);
      console.log(`[PERF]   - Tap to Navigation: ${((timing.navigationCallTime || 0) - timing.tapTime).toFixed(2)}ms`);
      console.log(`[PERF]   - Navigation to Mount: ${((timing.screenMountTime || 0) - (timing.navigationCallTime || 0)).toFixed(2)}ms`);
      console.log(`[PERF]   - Fetch Duration: ${((timing.dataFetchEndTime || 0) - (timing.dataFetchStartTime || 0)).toFixed(2)}ms`);
      console.log(`[PERF] ═══════════════════════════════════════`);
      
      // Clean up after logging
      setTimeout(() => navigationTimings.delete(productId), 5000);
    }
  }
}

/**
 * Get timing for a product (for debugging)
 */
export function getNavigationTiming(productId: string): NavigationTiming | undefined {
  return navigationTimings.get(productId);
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