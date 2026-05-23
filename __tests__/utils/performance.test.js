import PerformanceMonitor, {
  usePerformanceMonitor,
  useNetworkMonitor,
  markTapStart,
  markNavigationCall,
  markScreenMount,
  markFetchStart,
  markFetchEnd,
  markContentReady,
  getNavigationTiming,
} from '@/utils/performance';

describe('Performance Monitor', () => {
  beforeEach(() => {
    // Reset singleton instance — the monitor persists across tests, so clear
    // accumulated metrics to keep per-test counts isolated.
    PerformanceMonitor.setEnabled(true);
    PerformanceMonitor.clear();
  });

  describe('PerformanceMonitor Instance', () => {
    it('should be a singleton', () => {
      const instance1 = PerformanceMonitor;
      const instance2 = PerformanceMonitor;
      expect(instance1).toBe(instance2);
    });

    it('should measure component performance', () => {
      const mockCallback = jest.fn();
      
      PerformanceMonitor.measureComponent('TestComponent', mockCallback);
      
      expect(mockCallback).toHaveBeenCalled();
    });

    it('should measure network requests', () => {
      PerformanceMonitor.measureNetworkRequest('/test', 'GET', 1000, 2000, 200);
      
      const stats = PerformanceMonitor.getNetworkStats();
      expect(stats).toBeTruthy();
      expect(stats.totalRequests).toBe(1);
    });

    it('should get performance stats', () => {
      // Add some test data
      PerformanceMonitor.measureComponent('TestComponent', () => {});
      
      const stats = PerformanceMonitor.getPerformanceStats();
      expect(stats).toBeTruthy();
      expect(stats.totalComponents).toBe(1);
    });

    it('should export data', () => {
      const data = PerformanceMonitor.exportData();
      expect(data).toHaveProperty('performance');
      expect(data).toHaveProperty('network');
      expect(data).toHaveProperty('rawMetrics');
      expect(data).toHaveProperty('rawNetworkMetrics');
    });

    it('should cleanup old data', () => {
      // Add some test data
      PerformanceMonitor.measureComponent('TestComponent', () => {});
      PerformanceMonitor.measureNetworkRequest('/test', 'GET', 1000, 2000, 200);
      
      PerformanceMonitor.cleanup();
      
      // Should still have data since it's recent
      const stats = PerformanceMonitor.getPerformanceStats();
      expect(stats).toBeTruthy();
    });

    it('should enable/disable monitoring', () => {
      PerformanceMonitor.setEnabled(false);
      const mockCallback = jest.fn();
      PerformanceMonitor.measureComponent('TestComponent', mockCallback);
      
      expect(mockCallback).toHaveBeenCalled();
      
      PerformanceMonitor.setEnabled(true);
    });
  });

  describe('usePerformanceMonitor Hook', () => {
    it('should return measureRender function', () => {
      const { measureRender } = usePerformanceMonitor('TestComponent');
      expect(typeof measureRender).toBe('function');
    });

    it('should measure render when called', () => {
      const { measureRender } = usePerformanceMonitor('TestComponent');
      const mockCallback = jest.fn();
      
      measureRender(mockCallback);
      
      expect(mockCallback).toHaveBeenCalled();
    });
  });

  describe('useNetworkMonitor Hook', () => {
    it('should return measureRequest function', () => {
      const { measureRequest } = useNetworkMonitor();
      expect(typeof measureRequest).toBe('function');
    });

    it('should measure request when called', () => {
      const { measureRequest } = useNetworkMonitor();

      measureRequest('/test', 'GET', 1000, 2000, 200);

      const stats = PerformanceMonitor.getNetworkStats();
      expect(stats.totalRequests).toBe(1);
    });
  });

  describe('empty / disabled state', () => {
    it('returns null stats before anything is measured', () => {
      expect(PerformanceMonitor.getPerformanceStats()).toBeNull();
      expect(PerformanceMonitor.getNetworkStats()).toBeNull();
    });

    it('does not record network metrics while disabled', () => {
      PerformanceMonitor.setEnabled(false);
      PerformanceMonitor.measureNetworkRequest('/x', 'GET', 0, 1, 200);
      PerformanceMonitor.setEnabled(true);
      expect(PerformanceMonitor.getNetworkStats()).toBeNull();
    });
  });
});

describe('Navigation timing', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('records a tap start for a product', () => {
    markTapStart('prod-1');

    const timing = getNavigationTiming('prod-1');
    expect(timing).toBeTruthy();
    expect(timing.productId).toBe('prod-1');
    expect(typeof timing.tapTime).toBe('number');
  });

  it('records every stage of the navigation lifecycle', () => {
    markTapStart('prod-2');
    markNavigationCall('prod-2');
    markScreenMount('prod-2');
    markFetchStart('prod-2');
    markFetchEnd('prod-2');

    const timing = getNavigationTiming('prod-2');
    expect(timing.navigationCallTime).toBeDefined();
    expect(timing.screenMountTime).toBeDefined();
    expect(timing.dataFetchStartTime).toBeDefined();
    expect(timing.dataFetchEndTime).toBeDefined();
  });

  it('ignores lifecycle marks for an unknown product', () => {
    // No markTapStart for this id — every later mark must be a safe no-op.
    markNavigationCall('ghost');
    markScreenMount('ghost');
    markFetchStart('ghost');
    markFetchEnd('ghost');
    markContentReady('ghost');

    expect(getNavigationTiming('ghost')).toBeUndefined();
  });

  it('tolerates marks that arrive out of order', () => {
    markTapStart('prod-4');
    // Skip markNavigationCall and markScreenMount — exercises the missing-stage
    // fallbacks inside the downstream marks.
    markFetchEnd('prod-4');
    markContentReady('prod-4');

    expect(getNavigationTiming('prod-4')).toBeTruthy();
  });

  it('cleans up a completed timeline after the delay', () => {
    markTapStart('prod-3');
    markNavigationCall('prod-3');
    markScreenMount('prod-3');
    markFetchStart('prod-3');
    markFetchEnd('prod-3');
    markContentReady('prod-3');

    // Still present immediately after content is ready...
    expect(getNavigationTiming('prod-3')).toBeTruthy();

    // ...and removed once the 5s cleanup timer fires.
    jest.advanceTimersByTime(5000);
    expect(getNavigationTiming('prod-3')).toBeUndefined();
  });
}); 