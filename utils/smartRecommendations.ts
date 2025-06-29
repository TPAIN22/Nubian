import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from './axiosInstans';

interface UserBehavior {
  userId: string;
  purchases: Array<{
    productId: string;
    category: string;
    price: number;
    timestamp: number;
  }>;
  views: Array<{
    productId: string;
    duration: number;
    timestamp: number;
  }>;
  searches: Array<{
    query: string;
    timestamp: number;
  }>;
  ratings: Array<{
    productId: string;
    rating: number;
    timestamp: number;
  }>;
}

interface UserPreferences {
  favoriteCategories: string[];
  priceRange: { min: number; max: number };
  brandPreferences: string[];
  stylePreferences: string[];
  activityTime: string;
  purchaseFrequency: number;
}

interface Recommendation {
  productId: string;
  score: number;
  reason: string;
  type: 'collaborative' | 'content-based' | 'trending';
}

class SmartRecommendationSystem {
  private static instance: SmartRecommendationSystem;
  private userBehaviors: Map<string, UserBehavior> = new Map();

  static getInstance(): SmartRecommendationSystem {
    if (!SmartRecommendationSystem.instance) {
      SmartRecommendationSystem.instance = new SmartRecommendationSystem();
    }
    return SmartRecommendationSystem.instance;
  }

  // تسجيل سلوك المستخدم
  async trackUserBehavior(userId: string, action: string, data: any): Promise<void> {
    try {
      const behavior = await this.getUserBehavior(userId);
      
      switch (action) {
        case 'purchase':
          behavior.purchases.push({
            productId: data.productId,
            category: data.category,
            price: data.price,
            timestamp: Date.now()
          });
          break;
          
        case 'view':
          behavior.views.push({
            productId: data.productId,
            duration: data.duration || 0,
            timestamp: Date.now()
          });
          break;
          
        case 'search':
          behavior.searches.push({
            query: data.query,
            timestamp: Date.now()
          });
          break;
          
        case 'rating':
          behavior.ratings.push({
            productId: data.productId,
            rating: data.rating,
            timestamp: Date.now()
          });
          break;
      }
      
      await this.saveUserBehavior(userId, behavior);
    } catch (error) {
      console.error('Error tracking user behavior:', error);
    }
  }

  // تحليل تفضيلات المستخدم
  async analyzeUserPreferences(userId: string): Promise<UserPreferences> {
    const behavior = await this.getUserBehavior(userId);
    
    // تحليل الفئات المفضلة
    const categoryCounts = new Map<string, number>();
    behavior.purchases.forEach(purchase => {
      categoryCounts.set(purchase.category, (categoryCounts.get(purchase.category) || 0) + 1);
    });
    
    const favoriteCategories = Array.from(categoryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category]) => category);

    // تحليل نطاق السعر
    const prices = behavior.purchases.map(p => p.price);
    const priceRange = {
      min: prices.length > 0 ? Math.min(...prices) : 0,
      max: prices.length > 0 ? Math.max(...prices) : 1000
    };

    // تحليل توقيت النشاط
    const activityHours = behavior.purchases.map(p => new Date(p.timestamp).getHours());
    const mostActiveHour = this.getMostFrequent(activityHours);
    const activityTime = this.getActivityTimeLabel(mostActiveHour);

    // حساب تكرار الشراء
    const purchaseFrequency = behavior.purchases.length / Math.max(1, this.getDaysSinceFirstPurchase(behavior));

    return {
      favoriteCategories,
      priceRange,
      brandPreferences: [], // يمكن إضافة تحليل العلامات التجارية
      stylePreferences: [], // يمكن إضافة تحليل الأنماط
      activityTime,
      purchaseFrequency
    };
  }

  // التوصيات التعاونية (بناءً على سلوك المستخدمين المشابهين)
  async getCollaborativeRecommendations(userId: string): Promise<Recommendation[]> {
    try {
      const userPreferences = await this.analyzeUserPreferences(userId);
      
      // البحث عن منتجات في الفئات المفضلة
      const recommendations: Recommendation[] = [];
      
      for (const category of userPreferences.favoriteCategories) {
        const products = await this.getProductsByCategory(category);
        
        // تصفية حسب نطاق السعر
        const filteredProducts = products.filter(product => 
          product.price >= userPreferences.priceRange.min && 
          product.price <= userPreferences.priceRange.max
        );
        
        // إضافة التوصيات
        filteredProducts.slice(0, 3).forEach(product => {
          recommendations.push({
            productId: product._id,
            score: 0.8,
            reason: `بناءً على اهتمامك بـ ${category}`,
            type: 'collaborative'
          });
        });
      }
      
      return recommendations.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('Error getting collaborative recommendations:', error);
      return [];
    }
  }

  // التوصيات بناءً على المحتوى
  async getContentBasedRecommendations(userId: string): Promise<Recommendation[]> {
    try {
      const behavior = await this.getUserBehavior(userId);
      const recommendations: Recommendation[] = [];
      
      // تحليل المنتجات التي شاهدها المستخدم
      const viewedProducts = behavior.views.map(v => v.productId);
      const uniqueViewedProducts = [...new Set(viewedProducts)];
      
      for (const productId of uniqueViewedProducts.slice(0, 5)) {
        const similarProducts = await this.getSimilarProducts(productId);
        
        similarProducts.forEach(product => {
          if (!viewedProducts.includes(product._id)) {
            recommendations.push({
              productId: product._id,
              score: 0.7,
              reason: 'مشابه للمنتجات التي شاهدتها',
              type: 'content-based'
            });
          }
        });
      }
      
      return recommendations.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('Error getting content-based recommendations:', error);
      return [];
    }
  }

  // التوصيات الرائجة
  async getTrendingRecommendations(): Promise<Recommendation[]> {
    try {
      const trendingProducts = await this.getTrendingProducts();
      
      return trendingProducts.map(product => ({
        productId: product._id,
        score: 0.6,
        reason: 'منتجات رائجة الآن',
        type: 'trending'
      }));
    } catch (error) {
      console.error('Error getting trending recommendations:', error);
      return [];
    }
  }

  // الحصول على جميع التوصيات
  async getAllRecommendations(userId: string): Promise<Recommendation[]> {
    const [collaborative, contentBased, trending] = await Promise.all([
      this.getCollaborativeRecommendations(userId),
      this.getContentBasedRecommendations(userId),
      this.getTrendingRecommendations()
    ]);
    
    // دمج التوصيات وإزالة التكرار
    const allRecommendations = [...collaborative, ...contentBased, ...trending];
    const uniqueRecommendations = this.removeDuplicateRecommendations(allRecommendations);
    
    return uniqueRecommendations.sort((a, b) => b.score - a.score).slice(0, 10);
  }

  // Helper methods
  private async getUserBehavior(userId: string): Promise<UserBehavior> {
    const cached = this.userBehaviors.get(userId);
    if (cached) return cached;
    
    const stored = await AsyncStorage.getItem(`user_behavior_${userId}`);
    if (stored) {
      const behavior = JSON.parse(stored);
      this.userBehaviors.set(userId, behavior);
      return behavior;
    }
    
    const newBehavior: UserBehavior = {
      userId,
      purchases: [],
      views: [],
      searches: [],
      ratings: []
    };
    
    this.userBehaviors.set(userId, newBehavior);
    return newBehavior;
  }

  private async saveUserBehavior(userId: string, behavior: UserBehavior): Promise<void> {
    this.userBehaviors.set(userId, behavior);
    await AsyncStorage.setItem(`user_behavior_${userId}`, JSON.stringify(behavior));
  }

  private getMostFrequent(arr: number[]): number {
    if (arr.length === 0) return 12;
    const counts = new Map<number, number>();
    arr.forEach(item => counts.set(item, (counts.get(item) || 0) + 1));
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 12;
  }

  private getActivityTimeLabel(hour: number): string {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  }

  private getDaysSinceFirstPurchase(behavior: UserBehavior): number {
    if (behavior.purchases.length === 0) return 1;
    const firstPurchase = Math.min(...behavior.purchases.map(p => p.timestamp));
    return Math.ceil((Date.now() - firstPurchase) / (1000 * 60 * 60 * 24));
  }

  private async getProductsByCategory(category: string): Promise<any[]> {
    try {
      const response = await axiosInstance.get(`/products?category=${category}&limit=10`);
      return response.data.products || [];
    } catch (error) {
      console.error('Error fetching products by category:', error);
      return [];
    }
  }

  private async getSimilarProducts(productId: string): Promise<any[]> {
    try {
      const response = await axiosInstance.get(`/products/${productId}/similar`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching similar products:', error);
      return [];
    }
  }

  private async getTrendingProducts(): Promise<any[]> {
    try {
      const response = await axiosInstance.get('/products/trending');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching trending products:', error);
      return [];
    }
  }

  private removeDuplicateRecommendations(recommendations: Recommendation[]): Recommendation[] {
    const seen = new Set<string>();
    return recommendations.filter(rec => {
      if (seen.has(rec.productId)) return false;
      seen.add(rec.productId);
      return true;
    });
  }
}

export default SmartRecommendationSystem.getInstance(); 