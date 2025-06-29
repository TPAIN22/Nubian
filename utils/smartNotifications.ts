import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import SmartRecommendationSystem from './smartRecommendations';

interface NotificationTemplate {
  id: string;
  title: string;
  body: string;
  data?: any;
  trigger?: any;
  priority?: 'default' | 'normal' | 'high';
}

interface UserNotificationSettings {
  userId: string;
  enabled: boolean;
  categories: {
    promotions: boolean;
    recommendations: boolean;
    orderUpdates: boolean;
    priceDrops: boolean;
    newArrivals: boolean;
  };
  timing: {
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
    night: boolean;
  };
  frequency: 'daily' | 'weekly' | 'monthly';
}

class SmartNotificationSystem {
  private static instance: SmartNotificationSystem;
  private recommendationSystem = SmartRecommendationSystem;
  private notificationHistory: Map<string, any[]> = new Map();

  static getInstance(): SmartNotificationSystem {
    if (!SmartNotificationSystem.instance) {
      SmartNotificationSystem.instance = new SmartNotificationSystem();
    }
    return SmartNotificationSystem.instance;
  }

  // إعداد الإشعارات
  async setupNotifications(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Notification permissions not granted');
        return false;
      }

      // إعداد معالج الإشعارات
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      return true;
    } catch (error) {
      console.error('Error setting up notifications:', error);
      return false;
    }
  }

  // إشعارات بناءً على سلوك الشراء
  async sendPurchaseBasedNotification(userId: string): Promise<void> {
    try {
      const userPreferences = await this.recommendationSystem.analyzeUserPreferences(userId);
      const recommendations = await this.recommendationSystem.getAllRecommendations(userId);
      
      if (recommendations.length === 0) return;

      const topRecommendation = recommendations[0];
      if (!topRecommendation) return;
      
      const notification: NotificationTemplate = {
        id: `purchase_${Date.now()}`,
        title: this.getLocalizedTitle('purchase_based', userPreferences.favoriteCategories[0] || 'default'),
        body: this.getLocalizedBody('purchase_based', topRecommendation.reason),
        data: {
          type: 'recommendation',
          productId: topRecommendation.productId,
          category: userPreferences.favoriteCategories[0] || 'default'
        },
        priority: 'normal'
      };

      await this.scheduleNotification(notification);
    } catch (error) {
      console.error('Error sending purchase-based notification:', error);
    }
  }

  // إشعارات بناءً على التوقيت
  async sendTimeBasedNotification(userId: string): Promise<void> {
    try {
      const userPreferences = await this.recommendationSystem.analyzeUserPreferences(userId);
      const settings = await this.getUserNotificationSettings(userId);
      
      if (!settings.enabled) return;

      const currentHour = new Date().getHours();
      const currentTimeLabel = this.getTimeLabel(currentHour);
      
      if (!settings.timing[currentTimeLabel as keyof typeof settings.timing]) return;

      const notification: NotificationTemplate = {
        id: `time_${Date.now()}`,
        title: this.getLocalizedTitle('time_based', currentTimeLabel),
        body: this.getLocalizedBody('time_based', currentTimeLabel),
        data: {
          type: 'time_based',
          timeLabel: currentTimeLabel
        },
        priority: 'normal'
      };

      await this.scheduleNotification(notification);
    } catch (error) {
      console.error('Error sending time-based notification:', error);
    }
  }

  // إشعارات انخفاض الأسعار
  async sendPriceDropNotification(userId: string, productId: string, oldPrice: number, newPrice: number): Promise<void> {
    try {
      const discount = Math.round(((oldPrice - newPrice) / oldPrice) * 100);
      
      const notification: NotificationTemplate = {
        id: `price_drop_${productId}_${Date.now()}`,
        title: `خصم ${discount}% على منتجك المفضل! 💰`,
        body: `انخفض السعر من ${oldPrice} إلى ${newPrice} ريال`,
        data: {
          type: 'price_drop',
          productId,
          oldPrice,
          newPrice,
          discount
        },
        priority: 'high'
      };

      await this.scheduleNotification(notification);
    } catch (error) {
      console.error('Error sending price drop notification:', error);
    }
  }

  // إشعارات وصول منتجات جديدة
  async sendNewArrivalsNotification(userId: string, category: string): Promise<void> {
    try {
      const userPreferences = await this.recommendationSystem.analyzeUserPreferences(userId);
      
      if (!userPreferences.favoriteCategories.includes(category)) return;

      const notification: NotificationTemplate = {
        id: `new_arrivals_${category}_${Date.now()}`,
        title: `منتجات جديدة في ${this.getCategoryName(category)} 🆕`,
        body: 'اكتشف أحدث المنتجات التي وصلت للتو',
        data: {
          type: 'new_arrivals',
          category
        },
        priority: 'normal'
      };

      await this.scheduleNotification(notification);
    } catch (error) {
      console.error('Error sending new arrivals notification:', error);
    }
  }

  // إشعارات تذكير بالعربة
  async sendCartReminderNotification(userId: string): Promise<void> {
    try {
      const cartItems = await this.getCartItems(userId);
      
      if (cartItems.length === 0) return;

      const notification: NotificationTemplate = {
        id: `cart_reminder_${Date.now()}`,
        title: 'لا تنسى عربة التسوق! 🛒',
        body: `لديك ${cartItems.length} منتج في العربة بانتظارك`,
        data: {
          type: 'cart_reminder',
          itemCount: cartItems.length
        },
        priority: 'normal'
      };

      await this.scheduleNotification(notification);
    } catch (error) {
      console.error('Error sending cart reminder notification:', error);
    }
  }

  // إشعارات العروض الخاصة
  async sendSpecialOfferNotification(userId: string, offerType: string): Promise<void> {
    try {
      const notification: NotificationTemplate = {
        id: `special_offer_${offerType}_${Date.now()}`,
        title: this.getLocalizedTitle('special_offer', offerType),
        body: this.getLocalizedBody('special_offer', offerType),
        data: {
          type: 'special_offer',
          offerType
        },
        priority: 'high'
      };

      await this.scheduleNotification(notification);
    } catch (error) {
      console.error('Error sending special offer notification:', error);
    }
  }

  // جدولة الإشعارات
  private async scheduleNotification(notification: NotificationTemplate): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: notification.id,
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data,
          sound: 'default',
          priority: notification.priority || 'default'
        },
        trigger: notification.trigger || null
      });

      // حفظ في التاريخ
      await this.saveNotificationHistory(notification);
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }

  // إرسال إشعار فوري
  async sendImmediateNotification(notification: NotificationTemplate): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: notification.id,
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data,
          sound: 'default',
          priority: notification.priority || 'default'
        },
        trigger: null // إرسال فوري
      });

      await this.saveNotificationHistory(notification);
    } catch (error) {
      console.error('Error sending immediate notification:', error);
    }
  }

  // Helper methods
  private getLocalizedTitle(type: string, context: string): string {
    const titles: Record<string, Record<string, string>> = {
      purchase_based: {
        'electronics': 'إلكترونيات جديدة تناسبك! 📱',
        'clothing': 'أزياء جديدة تناسبك! 👗',
        'home': 'منتجات منزلية جديدة! 🏠',
        'default': 'منتجات جديدة تناسبك! 🎁'
      },
      time_based: {
        'morning': 'صباح الخير! تسوق صباحي مريح ☀️',
        'afternoon': 'استراحة غداء مع عروض مميزة 🍽️',
        'evening': 'تسوق مسائي مريح 🌙',
        'night': 'عروض ليلية خاصة 🌃'
      },
      special_offer: {
        'flash_sale': 'عرض خاطف! لا تفوت الفرصة ⚡',
        'weekend': 'عروض نهاية الأسبوع 🎉',
        'holiday': 'عروض العيد 🎊',
        'default': 'عرض خاص لك! 🎁'
      }
    };

    return titles[type]?.[context] || titles[type]?.default || 'إشعار جديد! 📢';
  }

  private getLocalizedBody(type: string, context: string): string {
    const bodies: Record<string, Record<string, string>> = {
      purchase_based: {
        'electronics': 'اكتشف أحدث الإلكترونيات بأسعار مميزة',
        'clothing': 'أزياء جديدة تناسب ذوقك',
        'home': 'منتجات منزلية عصرية',
        'default': 'منتجات جديدة تناسب اهتماماتك'
      },
      time_based: {
        'morning': 'ابدأ يومك بتسوق مريح',
        'afternoon': 'استمتع بعروض الغداء',
        'evening': 'تسوق مسائي هادئ',
        'night': 'عروض ليلية حصرية'
      },
      special_offer: {
        'flash_sale': 'عروض محدودة الوقت',
        'weekend': 'عروض نهاية الأسبوع',
        'holiday': 'عروض العيد المميزة',
        'default': 'عرض خاص لك'
      }
    };

    return bodies[type]?.[context] || bodies[type]?.default || 'لديك إشعار جديد';
  }

  private getTimeLabel(hour: number): string {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  }

  private getCategoryName(category: string): string {
    const categories: Record<string, string> = {
      'electronics': 'الإلكترونيات',
      'clothing': 'الأزياء',
      'home': 'المنزل',
      'books': 'الكتب',
      'sports': 'الرياضة'
    };
    return categories[category] || category;
  }

  private async getUserNotificationSettings(userId: string): Promise<UserNotificationSettings> {
    try {
      const stored = await AsyncStorage.getItem(`notification_settings_${userId}`);
      if (stored) {
        return JSON.parse(stored);
      }
      
      // إعدادات افتراضية
      const defaultSettings: UserNotificationSettings = {
        userId,
        enabled: true,
        categories: {
          promotions: true,
          recommendations: true,
          orderUpdates: true,
          priceDrops: true,
          newArrivals: true
        },
        timing: {
          morning: true,
          afternoon: true,
          evening: true,
          night: false
        },
        frequency: 'daily'
      };
      
      await AsyncStorage.setItem(`notification_settings_${userId}`, JSON.stringify(defaultSettings));
      return defaultSettings;
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return {
        userId,
        enabled: true,
        categories: { promotions: true, recommendations: true, orderUpdates: true, priceDrops: true, newArrivals: true },
        timing: { morning: true, afternoon: true, evening: true, night: false },
        frequency: 'daily'
      };
    }
  }

  private async getCartItems(userId: string): Promise<any[]> {
    try {
      // يمكن استبدال هذا بطلب API حقيقي
      const stored = await AsyncStorage.getItem(`cart_${userId}`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting cart items:', error);
      return [];
    }
  }

  private async saveNotificationHistory(notification: NotificationTemplate): Promise<void> {
    try {
      const history = this.notificationHistory.get(notification.data?.userId || 'default') || [];
      history.push({
        ...notification,
        sentAt: Date.now()
      });
      
      // الاحتفاظ بآخر 50 إشعار فقط
      if (history.length > 50) {
        history.splice(0, history.length - 50);
      }
      
      this.notificationHistory.set(notification.data?.userId || 'default', history);
    } catch (error) {
      console.error('Error saving notification history:', error);
    }
  }

  // الحصول على تاريخ الإشعارات
  async getNotificationHistory(userId: string): Promise<any[]> {
    return this.notificationHistory.get(userId) || [];
  }

  // مسح جميع الإشعارات
  async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      this.notificationHistory.clear();
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }
}

export default SmartNotificationSystem.getInstance(); 