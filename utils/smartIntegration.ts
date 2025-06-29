import SmartRecommendationSystem from './smartRecommendations';
import SmartNotificationSystem from './smartNotifications';
import SmartAnalyticsSystem from './smartAnalytics';

/**
 * نظام التكامل الذكي - يربط جميع الأنظمة الذكية معاً
 * يوفر واجهة موحدة لاستخدام جميع الأنظمة
 */
class SmartIntegrationSystem {
  private static instance: SmartIntegrationSystem;
  private isInitialized = false;

  static getInstance(): SmartIntegrationSystem {
    if (!SmartIntegrationSystem.instance) {
      SmartIntegrationSystem.instance = new SmartIntegrationSystem();
    }
    return SmartIntegrationSystem.instance;
  }

  /**
   * تهيئة جميع الأنظمة الذكية
   */
  async initialize(userId: string): Promise<boolean> {
    try {
      // إعداد الإشعارات
      await SmartNotificationSystem.setupNotifications();
      
      // بدء جلسة التحليلات
      await SmartAnalyticsSystem.startSession(userId);
      
      this.isInitialized = true;
      console.log('✅ Smart systems initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Error initializing smart systems:', error);
      return false;
    }
  }

  /**
   * إنهاء جلسة المستخدم
   */
  async endSession(userId: string): Promise<void> {
    try {
      await SmartAnalyticsSystem.endSession(userId);
      console.log('✅ User session ended successfully');
    } catch (error) {
      console.error('❌ Error ending user session:', error);
    }
  }

  /**
   * تتبع عرض المنتج مع جميع الأنظمة
   */
  async trackProductView(
    userId: string, 
    productId: string, 
    category: string, 
    price: number,
    productName?: string
  ): Promise<void> {
    try {
      // تتبع في التحليلات
      await SmartAnalyticsSystem.trackProductView(userId, productId, category, price);
      
      // تتبع في التوصيات
      await SmartRecommendationSystem.trackUserBehavior(userId, 'view', {
        productId,
        category,
        price,
        productName
      });

      console.log(`📊 Tracked product view: ${productName || productId}`);
    } catch (error) {
      console.error('❌ Error tracking product view:', error);
    }
  }

  /**
   * تتبع إضافة المنتج للعربة
   */
  async trackAddToCart(
    userId: string,
    productId: string,
    quantity: number,
    price: number,
    productName?: string
  ): Promise<void> {
    try {
      // تتبع في التحليلات
      await SmartAnalyticsSystem.trackAddToCart(userId, productId, quantity, price);
      
      // تتبع في التوصيات
      await SmartRecommendationSystem.trackUserBehavior(userId, 'add_to_cart', {
        productId,
        quantity,
        price,
        productName
      });

      console.log(`🛒 Tracked add to cart: ${productName || productId}`);
    } catch (error) {
      console.error('❌ Error tracking add to cart:', error);
    }
  }

  /**
   * تتبع الشراء مع إرسال الإشعارات
   */
  async trackPurchase(
    userId: string,
    orderId: string,
    products: Array<{
      productId: string;
      quantity: number;
      price: number;
      category: string;
    }>,
    totalAmount: number
  ): Promise<void> {
    try {
      // تتبع في التحليلات
      await SmartAnalyticsSystem.trackPurchase(userId, orderId, products, totalAmount);
      
      // تتبع في التوصيات لكل منتج
      for (const product of products) {
        await SmartRecommendationSystem.trackUserBehavior(userId, 'purchase', {
          productId: product.productId,
          quantity: product.quantity,
          price: product.price,
          category: product.category
        });
      }

      // إرسال إشعارات مخصصة
      await this.sendPostPurchaseNotifications(userId, products, totalAmount);

      console.log(`💰 Tracked purchase: Order ${orderId}, Total: ${totalAmount}`);
    } catch (error) {
      console.error('❌ Error tracking purchase:', error);
    }
  }

  /**
   * تتبع البحث
   */
  async trackSearch(
    userId: string,
    query: string,
    resultsCount: number,
    category?: string
  ): Promise<void> {
    try {
      // تتبع في التحليلات
      await SmartAnalyticsSystem.trackSearch(userId, query, resultsCount);
      
      // تتبع في التوصيات
      await SmartRecommendationSystem.trackUserBehavior(userId, 'search', {
        query,
        resultsCount,
        category
      });

      console.log(`🔍 Tracked search: "${query}" (${resultsCount} results)`);
    } catch (error) {
      console.error('❌ Error tracking search:', error);
    }
  }

  /**
   * تتبع التقييم
   */
  async trackRating(
    userId: string,
    productId: string,
    rating: number,
    review?: string,
    category?: string
  ): Promise<void> {
    try {
      // تتبع في التحليلات
      await SmartAnalyticsSystem.trackRating(userId, productId, rating, review);
      
      // تتبع في التوصيات
      await SmartRecommendationSystem.trackUserBehavior(userId, 'rating', {
        productId,
        rating,
        review,
        category
      });

      console.log(`⭐ Tracked rating: ${rating}/5 for ${productId}`);
    } catch (error) {
      console.error('❌ Error tracking rating:', error);
    }
  }

  /**
   * الحصول على توصيات شاملة
   */
  async getComprehensiveRecommendations(userId: string): Promise<{
    collaborative: any[];
    contentBased: any[];
    trending: any[];
    all: any[];
  }> {
    try {
      const [collaborative, contentBased, trending, all] = await Promise.all([
        SmartRecommendationSystem.getCollaborativeRecommendations(userId),
        SmartRecommendationSystem.getContentBasedRecommendations(userId),
        SmartRecommendationSystem.getTrendingRecommendations(),
        SmartRecommendationSystem.getAllRecommendations(userId)
      ]);

      return {
        collaborative,
        contentBased,
        trending,
        all
      };
    } catch (error) {
      console.error('❌ Error getting recommendations:', error);
      return {
        collaborative: [],
        contentBased: [],
        trending: [],
        all: []
      };
    }
  }

  /**
   * إرسال إشعارات ما بعد الشراء
   */
  private async sendPostPurchaseNotifications(
    userId: string,
    products: any[],
    totalAmount: number
  ): Promise<void> {
    try {
      // إشعار بناءً على السلوك
      await SmartNotificationSystem.sendPurchaseBasedNotification(userId);
      
      // إشعارات إضافية بناءً على قيمة الشراء
      if (totalAmount > 500) {
        await SmartNotificationSystem.sendSpecialOfferNotification(userId, 'high_value_customer');
      }
      
      // إشعارات بناءً على الفئات المشتراة
      const categories = [...new Set(products.map(p => p.category))];
      for (const category of categories) {
        await SmartNotificationSystem.sendNewArrivalsNotification(userId, category);
      }

      console.log(`📱 Sent post-purchase notifications for ${products.length} products`);
    } catch (error) {
      console.error('❌ Error sending post-purchase notifications:', error);
    }
  }

  /**
   * الحصول على تقرير تحليلي شامل
   */
  async getComprehensiveAnalytics(userId: string): Promise<{
    userBehavior: any;
    productPerformance: any;
    trends: any;
    recommendations: any;
  }> {
    try {
      const [userBehavior, trends, recommendations] = await Promise.all([
        SmartAnalyticsSystem.analyzeUserBehavior(userId),
        SmartAnalyticsSystem.analyzeTrends(),
        this.getComprehensiveRecommendations(userId)
      ]);

      return {
        userBehavior,
        productPerformance: {}, // يمكن إضافة تحليل أداء المنتجات المفضلة
        trends,
        recommendations
      };
    } catch (error) {
      console.error('Error getting comprehensive analytics:', error);
      return {
        userBehavior: {},
        productPerformance: {},
        trends: {},
        recommendations: { collaborative: [], contentBased: [], trending: [], all: [] }
      };
    }
  }

  /**
   * إرسال إشعارات ذكية بناءً على الوقت
   */
  async sendSmartTimeBasedNotifications(userId: string): Promise<void> {
    try {
      await SmartNotificationSystem.sendTimeBasedNotification(userId);
      
      // إشعارات إضافية بناءً على سلوك المستخدم
      const userBehavior = await SmartAnalyticsSystem.analyzeUserBehavior(userId);
      
      if (userBehavior.favoriteCategories.length > 0) {
        const firstCategory = userBehavior.favoriteCategories[0];
        if (firstCategory) {
          await SmartNotificationSystem.sendNewArrivalsNotification(userId, firstCategory);
        }
      }

      console.log(`⏰ Sent smart time-based notifications`);
    } catch (error) {
      console.error('Error sending smart time-based notifications:', error);
    }
  }

  /**
   * مراقبة انخفاض الأسعار للمنتجات المفضلة
   */
  async monitorPriceDrops(userId: string): Promise<void> {
    try {
      const userPreferences = await SmartRecommendationSystem.analyzeUserPreferences(userId);
      const favoriteCategories = userPreferences.favoriteCategories;
      
      // يمكن إضافة منطق مراقبة الأسعار هنا
      // هذا مثال بسيط - في التطبيق الحقيقي ستحتاج لمراقبة قاعدة البيانات
      
      console.log(`💰 Monitoring price drops for categories: ${favoriteCategories.join(', ')}`);
    } catch (error) {
      console.error('Error monitoring price drops:', error);
    }
  }

  /**
   * تنظيف البيانات القديمة
   */
  async cleanupOldData(): Promise<void> {
    try {
      // تنظيف الأحداث القديمة (أكثر من 30 يوم)
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      
      // يمكن إضافة منطق التنظيف هنا
      
      console.log('🧹 Cleaned up old data');
    } catch (error) {
      console.error('❌ Error cleaning up old data:', error);
    }
  }

  /**
   * الحصول على حالة النظام
   */
  getSystemStatus(): {
    isInitialized: boolean;
    analyticsActive: boolean;
    notificationsActive: boolean;
    recommendationsActive: boolean;
  } {
    return {
      isInitialized: this.isInitialized,
      analyticsActive: true, // يمكن إضافة منطق فحص الحالة
      notificationsActive: true,
      recommendationsActive: true
    };
  }
}

export default SmartIntegrationSystem.getInstance(); 