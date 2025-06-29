import SmartRecommendationSystem from '../utils/smartRecommendations';
import SmartNotificationSystem from '../utils/smartNotifications';
import SmartAnalyticsSystem from '../utils/smartAnalytics';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve()),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
}));

// Mock axios instance
jest.mock('../utils/axiosInstans', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

describe('Smart Systems Integration', () => {
  const mockUserId = 'user123';
  const mockProductId = 'product456';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Smart Recommendation System', () => {
    test('should track user behavior correctly', async () => {
      const behaviorData = {
        productId: mockProductId,
        category: 'electronics',
        price: 1500
      };

      await SmartRecommendationSystem.trackUserBehavior(mockUserId, 'view', behaviorData);
      
      // Verify behavior was tracked
      const userBehavior = await SmartRecommendationSystem['getUserBehavior'](mockUserId);
      expect(userBehavior.views).toHaveLength(1);
      expect(userBehavior.views[0].productId).toBe(mockProductId);
    });

    test('should analyze user preferences', async () => {
      // Add some mock behavior data
      await SmartRecommendationSystem.trackUserBehavior(mockUserId, 'purchase', {
        productId: 'phone1',
        category: 'electronics',
        price: 2000
      });

      await SmartRecommendationSystem.trackUserBehavior(mockUserId, 'purchase', {
        productId: 'phone2',
        category: 'electronics',
        price: 1800
      });

      const preferences = await SmartRecommendationSystem.analyzeUserPreferences(mockUserId);
      
      expect(preferences.favoriteCategories).toContain('electronics');
      expect(preferences.priceRange.min).toBe(1800);
      expect(preferences.priceRange.max).toBe(2000);
    });

    test('should get collaborative recommendations', async () => {
      // Mock API response
      const mockProducts = [
        { _id: 'product1', name: 'Phone 1', price: 1500 },
        { _id: 'product2', name: 'Phone 2', price: 1800 }
      ];

      require('../utils/axiosInstans').get.mockResolvedValue({
        data: { products: mockProducts }
      });

      const recommendations = await SmartRecommendationSystem.getCollaborativeRecommendations(mockUserId);
      
      expect(recommendations).toBeInstanceOf(Array);
      expect(recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Smart Notification System', () => {
    test('should setup notifications correctly', async () => {
      const result = await SmartNotificationSystem.setupNotifications();
      expect(result).toBe(true);
    });

    test('should send purchase-based notification', async () => {
      const scheduleNotificationAsync = require('expo-notifications').scheduleNotificationAsync;
      
      await SmartNotificationSystem.sendPurchaseBasedNotification(mockUserId);
      
      expect(scheduleNotificationAsync).toHaveBeenCalled();
      const callArgs = scheduleNotificationAsync.mock.calls[0][0];
      expect(callArgs.content.title).toContain('عروض');
    });

    test('should send time-based notification', async () => {
      const scheduleNotificationAsync = require('expo-notifications').scheduleNotificationAsync;
      
      await SmartNotificationSystem.sendTimeBasedNotification(mockUserId);
      
      expect(scheduleNotificationAsync).toHaveBeenCalled();
    });

    test('should send price drop notification', async () => {
      const scheduleNotificationAsync = require('expo-notifications').scheduleNotificationAsync;
      
      await SmartNotificationSystem.sendPriceDropNotification(mockUserId, mockProductId, 2000, 1500);
      
      expect(scheduleNotificationAsync).toHaveBeenCalled();
      const callArgs = scheduleNotificationAsync.mock.calls[0][0];
      expect(callArgs.content.title).toContain('خصم');
    });
  });

  describe('Smart Analytics System', () => {
    test('should start and end session correctly', async () => {
      await SmartAnalyticsSystem.startSession(mockUserId);
      
      expect(SmartAnalyticsSystem['sessionStartTime']).toBeGreaterThan(0);
      expect(SmartAnalyticsSystem['currentSessionId']).toContain(mockUserId);
      
      await SmartAnalyticsSystem.endSession(mockUserId);
      
      const events = SmartAnalyticsSystem['events'];
      const sessionEvents = events.filter(e => e.eventType === 'session_start' || e.eventType === 'session_end');
      expect(sessionEvents).toHaveLength(2);
    });

    test('should track product view', async () => {
      await SmartAnalyticsSystem.trackProductView(mockUserId, mockProductId, 'electronics', 1500);
      
      const events = SmartAnalyticsSystem['events'];
      const viewEvents = events.filter(e => e.eventType === 'product_view');
      expect(viewEvents).toHaveLength(1);
      expect(viewEvents[0].eventData.productId).toBe(mockProductId);
    });

    test('should track purchase', async () => {
      const mockProducts = [
        { productId: mockProductId, price: 1500, quantity: 1 }
      ];
      
      await SmartAnalyticsSystem.trackPurchase(mockUserId, 'order123', mockProducts, 1500);
      
      const events = SmartAnalyticsSystem['events'];
      const purchaseEvents = events.filter(e => e.eventType === 'purchase');
      expect(purchaseEvents).toHaveLength(1);
      expect(purchaseEvents[0].eventData.totalAmount).toBe(1500);
    });

    test('should analyze user behavior', async () => {
      // Add some mock events
      await SmartAnalyticsSystem.trackProductView(mockUserId, mockProductId, 'electronics', 1500);
      await SmartAnalyticsSystem.trackPurchase(mockUserId, 'order123', [], 1500);
      
      const analytics = await SmartAnalyticsSystem.analyzeUserBehavior(mockUserId);
      
      expect(analytics.userId).toBe(mockUserId);
      expect(analytics.favoriteCategories).toContain('electronics');
      expect(analytics.averageOrderValue).toBe(1500);
    });

    test('should analyze product performance', async () => {
      // Add some mock events for the product
      await SmartAnalyticsSystem.trackProductView(mockUserId, mockProductId, 'electronics', 1500);
      await SmartAnalyticsSystem.trackPurchase(mockUserId, 'order123', [{ productId: mockProductId }], 1500);
      
      const performance = await SmartAnalyticsSystem.analyzeProductPerformance(mockProductId);
      
      expect(performance.productId).toBe(mockProductId);
      expect(performance.views).toBe(1);
      expect(performance.purchases).toBe(1);
      expect(performance.revenue).toBe(1500);
    });
  });

  describe('Integration Tests', () => {
    test('should work together in a complete user journey', async () => {
      // 1. User starts session
      await SmartAnalyticsSystem.startSession(mockUserId);
      
      // 2. User views a product
      await SmartAnalyticsSystem.trackProductView(mockUserId, mockProductId, 'electronics', 1500);
      await SmartRecommendationSystem.trackUserBehavior(mockUserId, 'view', {
        productId: mockProductId,
        category: 'electronics'
      });
      
      // 3. User purchases the product
      await SmartAnalyticsSystem.trackPurchase(mockUserId, 'order123', [{ productId: mockProductId }], 1500);
      await SmartRecommendationSystem.trackUserBehavior(mockUserId, 'purchase', {
        productId: mockProductId,
        category: 'electronics'
      });
      
      // 4. System sends notification
      await SmartNotificationSystem.sendPurchaseBasedNotification(mockUserId);
      
      // 5. Verify all systems worked together
      const userAnalytics = await SmartAnalyticsSystem.analyzeUserBehavior(mockUserId);
      const userPreferences = await SmartRecommendationSystem.analyzeUserPreferences(mockUserId);
      
      expect(userAnalytics.favoriteCategories).toContain('electronics');
      expect(userPreferences.favoriteCategories).toContain('electronics');
    });

    test('should handle errors gracefully', async () => {
      // Mock API failure
      require('../utils/axiosInstans').get.mockRejectedValue(new Error('API Error'));
      
      // Should not throw error
      const recommendations = await SmartRecommendationSystem.getCollaborativeRecommendations(mockUserId);
      expect(recommendations).toEqual([]);
    });
  });

  describe('Performance Tests', () => {
    test('should handle multiple rapid events', async () => {
      const startTime = Date.now();
      
      // Simulate rapid user interactions
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(SmartAnalyticsSystem.trackProductView(mockUserId, `product${i}`, 'electronics', 1500));
      }
      
      await Promise.all(promises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (less than 1 second)
      expect(duration).toBeLessThan(1000);
      
      const events = SmartAnalyticsSystem['events'];
      expect(events.length).toBeGreaterThanOrEqual(10);
    });
  });
}); 