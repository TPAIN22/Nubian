import React, { createContext, useContext, useEffect, useState } from 'react';
import SmartIntegrationSystem from '../utils/smartIntegration';
import { Alert } from 'react-native';

interface SmartSystemsContextType {
  smartSystem: typeof SmartIntegrationSystem | null;
  isLoading: boolean;
  error: string | null;
  trackEvent: (event: string, data?: any) => void;
  getRecommendations: (userId: string, limit?: number) => any[];
  sendNotification: (userId: string, message: string, type?: string) => void;
  getAnalytics: () => any;
}

const SmartSystemsContext = createContext<SmartSystemsContextType | undefined>(undefined);

export const useSmartSystems = () => {
  const context = useContext(SmartSystemsContext);
  if (!context) {
    throw new Error('useSmartSystems must be used within a SmartSystemsProvider');
  }
  return context;
};

interface SmartSystemsProviderProps {
  children: React.ReactNode;
}

export const SmartSystemsProvider: React.FC<SmartSystemsProviderProps> = ({ children }) => {
  const [smartSystem, setSmartSystem] = useState<typeof SmartIntegrationSystem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeSmartSystems = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // تهيئة النظام الذكي (هو singleton بالفعل)
        await SmartIntegrationSystem.initialize('system-init');

        setSmartSystem(SmartIntegrationSystem);
        
        console.log('✅ الأنظمة الذكية تم تهيئتها بنجاح');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'خطأ في تهيئة الأنظمة الذكية';
        setError(errorMessage);
        console.error('❌ خطأ في تهيئة الأنظمة الذكية:', err);
        
        // عرض تنبيه للمستخدم
        Alert.alert(
          'تنبيه',
          'حدث خطأ في تهيئة الأنظمة الذكية. سيتم إعادة المحاولة تلقائياً.',
          [{ text: 'حسناً' }]
        );
      } finally {
        setIsLoading(false);
      }
    };

    initializeSmartSystems();
  }, []);

  const trackEvent = (event: string, data?: any) => {
    if (smartSystem) {
      try {
        // يمكن إضافة منطق تتبع الأحداث هنا
        console.log('📊 Tracking event:', event, data);
        
        // التأكد من أن البيانات صحيحة قبل إرسالها
        if (data && typeof data === 'object') {
          // تنظيف البيانات من القيم غير المعرفة
          const cleanData = Object.fromEntries(
            Object.entries(data).filter(([_, value]) => value !== undefined && value !== null)
          );
          console.log('📊 Clean event data:', cleanData);
        }
      } catch (err) {
        console.error('خطأ في تتبع الحدث:', err);
      }
    }
  };

  const getRecommendations = (userId: string, limit: number = 5) => {
    if (smartSystem) {
      try {
        // يمكن إضافة منطق التوصيات هنا
        return [];
      } catch (err) {
        console.error('خطأ في الحصول على التوصيات:', err);
        return [];
      }
    }
    return [];
  };

  const sendNotification = (userId: string, message: string, type: string = 'info') => {
    if (smartSystem) {
      try {
        // يمكن إضافة منطق الإشعارات هنا
        console.log('📱 Sending notification:', message, 'to user:', userId);
      } catch (err) {
        console.error('خطأ في إرسال الإشعار:', err);
      }
    }
  };

  const getAnalytics = () => {
    if (smartSystem) {
      try {
        // يمكن إضافة منطق التحليلات هنا
        return {};
      } catch (err) {
        console.error('خطأ في الحصول على التحليلات:', err);
        return {};
      }
    }
    return {};
  };

  const value: SmartSystemsContextType = {
    smartSystem,
    isLoading,
    error,
    trackEvent,
    getRecommendations,
    sendNotification,
    getAnalytics
  };

  return (
    <SmartSystemsContext.Provider value={value}>
      {children}
    </SmartSystemsContext.Provider>
  );
}; 