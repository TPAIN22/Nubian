import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from './axiosInstans';

interface AnalyticsEvent {
  userId: string;
  eventType: string;
  eventData: any;
  timestamp: number;
  sessionId: string;
  deviceInfo: {
    platform: string;
    version: string;
    model: string;
  };
}

interface UserAnalytics {
  userId: string;
  totalSessions: number;
  totalTimeSpent: number;
  favoriteCategories: string[];
  averageOrderValue: number;
  purchaseFrequency: number;
  lastActivity: number;
  conversionRate: number;
  retentionScore: number;
}

interface ProductAnalytics {
  productId: string;
  views: number;
  purchases: number;
  revenue: number;
  averageRating: number;
  conversionRate: number;
  trendingScore: number;
}

class SmartAnalyticsSystem {
  private static instance: SmartAnalyticsSystem;
  private events: AnalyticsEvent[] = [];
  private sessionStartTime: number = 0;
  private currentSessionId: string = '';

  static getInstance(): SmartAnalyticsSystem {
    if (!SmartAnalyticsSystem.instance) {
      SmartAnalyticsSystem.instance = new SmartAnalyticsSystem();
    }
    return SmartAnalyticsSystem.instance;
  }

  // بدء جلسة جديدة
  async startSession(userId: string) {
    this.sessionStartTime = Date.now();
    this.currentSessionId = `${userId}_${Date.now()}`;
    
    await this.trackEvent(userId, 'session_start', {
      sessionId: this.currentSessionId,
      timestamp: this.sessionStartTime
    });
  }

  // إنهاء الجلسة
  async endSession(userId: string) {
    const sessionDuration = Date.now() - this.sessionStartTime;
    
    await this.trackEvent(userId, 'session_end', {
      sessionId: this.currentSessionId,
      duration: sessionDuration,
      timestamp: Date.now()
    });
  }

  // تتبع الأحداث
  async trackEvent(userId: string, eventType: string, eventData: any) {
    try {
      const event: AnalyticsEvent = {
        userId,
        eventType,
        eventData,
        timestamp: Date.now(),
        sessionId: this.currentSessionId,
        deviceInfo: await this.getDeviceInfo()
      };

      this.events.push(event);
      
      // حفظ الحدث محلياً
      await this.saveEventLocally(event);
      
      // إرسال الحدث للخادم
      await this.sendEventToServer(event);
      
      // تحليل الحدث في الوقت الفعلي
      await this.analyzeEventInRealTime(event);
      
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }

  // تتبع عرض المنتج
  async trackProductView(userId: string, productId: string, category: string, price: number) {
    await this.trackEvent(userId, 'product_view', {
      productId,
      category,
      price,
      timestamp: Date.now()
    });
  }

  // تتبع إضافة المنتج للعربة
  async trackAddToCart(userId: string, productId: string, quantity: number, price: number) {
    await this.trackEvent(userId, 'add_to_cart', {
      productId,
      quantity,
      price,
      totalPrice: quantity * price,
      timestamp: Date.now()
    });
  }

  // تتبع الشراء
  async trackPurchase(userId: string, orderId: string, products: any[], totalAmount: number) {
    await this.trackEvent(userId, 'purchase', {
      orderId,
      products,
      totalAmount,
      timestamp: Date.now()
    });
  }

  // تتبع البحث
  async trackSearch(userId: string, query: string, resultsCount: number) {
    await this.trackEvent(userId, 'search', {
      query,
      resultsCount,
      timestamp: Date.now()
    });
  }

  // تتبع التقييم
  async trackRating(userId: string, productId: string, rating: number, review?: string) {
    await this.trackEvent(userId, 'rating', {
      productId,
      rating,
      review,
      timestamp: Date.now()
    });
  }

  // تحليل سلوك المستخدم
  async analyzeUserBehavior(userId: string): Promise<UserAnalytics> {
    try {
      const userEvents = this.events.filter(e => e.userId === userId);
      const purchaseEvents = userEvents.filter(e => e.eventType === 'purchase');
      const viewEvents = userEvents.filter(e => e.eventType === 'product_view');
      
      // حساب إجمالي الوقت المستغرق
      const sessionEvents = userEvents.filter(e => 
        e.eventType === 'session_start' || e.eventType === 'session_end'
      );
      
      let totalTimeSpent = 0;
      for (let i = 0; i < sessionEvents.length - 1; i += 2) {
        const startEvent = sessionEvents[i];
        const endEvent = sessionEvents[i + 1];
        
        if (startEvent && endEvent && 
            startEvent.eventType === 'session_start' && 
            endEvent.eventType === 'session_end') {
          totalTimeSpent += endEvent.timestamp - startEvent.timestamp;
        }
      }

      // تحليل الفئات المفضلة
      const categoryViews = new Map<string, number>();
      viewEvents.forEach(event => {
        const category = event.eventData.category;
        categoryViews.set(category, (categoryViews.get(category) || 0) + 1);
      });
      
      const favoriteCategories = Array.from(categoryViews.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([category]) => category);

      // حساب متوسط قيمة الطلب
      const totalRevenue = purchaseEvents.reduce((sum, event) => 
        sum + event.eventData.totalAmount, 0
      );
      const averageOrderValue = purchaseEvents.length > 0 ? 
        totalRevenue / purchaseEvents.length : 0;

      // حساب تكرار الشراء
      const daysSinceFirstPurchase = purchaseEvents.length > 0 ?
        (Date.now() - Math.min(...purchaseEvents.map(e => e.timestamp))) / (1000 * 60 * 60 * 24) : 0;
      const purchaseFrequency = daysSinceFirstPurchase > 0 ? 
        purchaseEvents.length / daysSinceFirstPurchase : 0;

      // حساب معدل التحويل
      const totalViews = viewEvents.length;
      const totalPurchases = purchaseEvents.length;
      const conversionRate = totalViews > 0 ? (totalPurchases / totalViews) * 100 : 0;

      // حساب درجة الاحتفاظ
      const lastActivity = userEvents.length > 0 ? 
        Math.max(...userEvents.map(e => e.timestamp)) : 0;
      const daysSinceLastActivity = (Date.now() - lastActivity) / (1000 * 60 * 60 * 24);
      const retentionScore = Math.max(0, 100 - (daysSinceLastActivity * 10));

      return {
        userId,
        totalSessions: sessionEvents.filter(e => e.eventType === 'session_start').length,
        totalTimeSpent,
        favoriteCategories,
        averageOrderValue,
        purchaseFrequency,
        lastActivity,
        conversionRate,
        retentionScore
      };
    } catch (error) {
      console.error('Error analyzing user behavior:', error);
      return {
        userId,
        totalSessions: 0,
        totalTimeSpent: 0,
        favoriteCategories: [],
        averageOrderValue: 0,
        purchaseFrequency: 0,
        lastActivity: 0,
        conversionRate: 0,
        retentionScore: 0
      };
    }
  }

  // تحليل أداء المنتج
  async analyzeProductPerformance(productId: string): Promise<ProductAnalytics> {
    try {
      const productEvents = this.events.filter(e => 
        e.eventData.productId === productId
      );
      
      const viewEvents = productEvents.filter(e => e.eventType === 'product_view');
      const purchaseEvents = productEvents.filter(e => e.eventType === 'purchase');
      const ratingEvents = productEvents.filter(e => e.eventType === 'rating');

      const views = viewEvents.length;
      const purchases = purchaseEvents.length;
      const revenue = purchaseEvents.reduce((sum, event) => 
        sum + event.eventData.totalAmount, 0
      );
      
      const averageRating = ratingEvents.length > 0 ?
        ratingEvents.reduce((sum, event) => sum + event.eventData.rating, 0) / ratingEvents.length : 0;
      
      const conversionRate = views > 0 ? (purchases / views) * 100 : 0;
      
      // حساب درجة الاتجاه
      const recentViews = viewEvents.filter(e => 
        Date.now() - e.timestamp < 7 * 24 * 60 * 60 * 1000 // آخر 7 أيام
      ).length;
      const trendingScore = recentViews / Math.max(1, views) * 100;

      return {
        productId,
        views,
        purchases,
        revenue,
        averageRating,
        conversionRate,
        trendingScore
      };
    } catch (error) {
      console.error('Error analyzing product performance:', error);
      return {
        productId,
        views: 0,
        purchases: 0,
        revenue: 0,
        averageRating: 0,
        conversionRate: 0,
        trendingScore: 0
      };
    }
  }

  // تحليل الاتجاهات العامة
  async analyzeTrends(): Promise<any> {
    try {
      const now = Date.now();
      const last24Hours = now - (24 * 60 * 60 * 1000);
      const last7Days = now - (7 * 24 * 60 * 60 * 1000);
      const last30Days = now - (30 * 24 * 60 * 60 * 1000);

      const recentEvents = this.events.filter(e => e.timestamp >= last30Days);
      
      // تحليل الأحداث حسب النوع
      const eventTypes = new Map<string, number>();
      recentEvents.forEach(event => {
        eventTypes.set(event.eventType, (eventTypes.get(event.eventType) || 0) + 1);
      });

      // تحليل الفئات الأكثر شعبية
      const categoryViews = new Map<string, number>();
      recentEvents
        .filter(e => e.eventType === 'product_view')
        .forEach(event => {
          const category = event.eventData.category;
          categoryViews.set(category, (categoryViews.get(category) || 0) + 1);
        });

      // تحليل معدل التحويل العام
      const totalViews = recentEvents.filter(e => e.eventType === 'product_view').length;
      const totalPurchases = recentEvents.filter(e => e.eventType === 'purchase').length;
      const overallConversionRate = totalViews > 0 ? (totalPurchases / totalViews) * 100 : 0;

      // تحليل الإيرادات
      const revenue = recentEvents
        .filter(e => e.eventType === 'purchase')
        .reduce((sum, event) => sum + event.eventData.totalAmount, 0);

      return {
        eventTypes: Object.fromEntries(eventTypes),
        popularCategories: Array.from(categoryViews.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10),
        overallConversionRate,
        totalRevenue: revenue,
        activeUsers: new Set(recentEvents.map(e => e.userId)).size,
        timeRanges: {
          last24Hours: recentEvents.filter(e => e.timestamp >= last24Hours).length,
          last7Days: recentEvents.filter(e => e.timestamp >= last7Days).length,
          last30Days: recentEvents.length
        }
      };
    } catch (error) {
      console.error('Error analyzing trends:', error);
      return {};
    }
  }

  // Helper methods
  private async getDeviceInfo() {
    // يمكن استبدال هذا بمعلومات الجهاز الحقيقية
    return {
      platform: 'react-native',
      version: '1.0.0',
      model: 'unknown'
    };
  }

  private async saveEventLocally(event: AnalyticsEvent) {
    try {
      const storedEvents = await AsyncStorage.getItem('analytics_events');
      const events = storedEvents ? JSON.parse(storedEvents) : [];
      events.push(event);
      
      // الاحتفاظ بآخر 1000 حدث فقط
      if (events.length > 1000) {
        events.splice(0, events.length - 1000);
      }
      
      await AsyncStorage.setItem('analytics_events', JSON.stringify(events));
    } catch (error) {
      console.error('Error saving event locally:', error);
    }
  }

  private async sendEventToServer(event: AnalyticsEvent) {
    try {
      await axiosInstance.post('/analytics/events', event);
    } catch (error) {
      console.error('Error sending event to server:', error);
      // يمكن إضافة إعادة المحاولة هنا
    }
  }

  private async analyzeEventInRealTime(event: AnalyticsEvent) {
    // تحليل فوري للأحداث المهمة
    if (event.eventType === 'purchase') {
      await this.handlePurchaseEvent(event);
    } else if (event.eventType === 'product_view') {
      await this.handleProductViewEvent(event);
    }
  }

  private async handlePurchaseEvent(event: AnalyticsEvent): Promise<void> {
    // يمكن إضافة منطق خاص بأحداث الشراء
    // مثل إرسال إشعارات، تحديث التوصيات، إلخ
    console.log('Processing purchase event:', event.eventData);
  }

  private async handleProductViewEvent(event: AnalyticsEvent): Promise<void> {
    // يمكن إضافة منطق خاص بأحداث عرض المنتج
    // مثل تحديث التوصيات، إرسال إشعارات، إلخ
    console.log('Processing product view event:', event.eventData);
  }

  // الحصول على تقرير تحليلي شامل
  async getComprehensiveReport(userId?: string) {
    try {
      const trends = await this.analyzeTrends();
      const userAnalytics = userId ? await this.analyzeUserBehavior(userId) : null;
      
      return {
        trends,
        userAnalytics,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error generating comprehensive report:', error);
      return null;
    }
  }

  // تصدير البيانات التحليلية
  async exportAnalyticsData(format: 'json' | 'csv' = 'json') {
    try {
      const data = {
        events: this.events,
        trends: await this.analyzeTrends(),
        timestamp: Date.now()
      };

      if (format === 'csv') {
        return this.convertToCSV(data);
      }

      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Error exporting analytics data:', error);
      return null;
    }
  }

  private convertToCSV(data: any): string {
    // تحويل بسيط إلى CSV
    const events = data.events;
    if (events.length === 0) return '';

    const headers = Object.keys(events[0]).join(',');
    const rows = events.map((event: any) => 
      Object.values(event).map(value => 
        typeof value === 'string' ? `"${value}"` : value
      ).join(',')
    );

    return [headers, ...rows].join('\n');
  }
}

export default SmartAnalyticsSystem.getInstance(); 