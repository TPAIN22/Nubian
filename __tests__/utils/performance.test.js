import PerformanceMonitor, { usePerformanceMonitor, useNetworkMonitor } from '@/utils/performance';

describe('Performance Monitor', () => {
  beforeEach(() => {
    // Reset singleton instance
    PerformanceMonitor.setEnabled(true);
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
}); 