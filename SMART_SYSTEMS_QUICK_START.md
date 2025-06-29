# دليل سريع لاستخدام الأنظمة الذكية

## ✅ تم دمج الأنظمة الذكية بنجاح!

### ما تم إنجازه:

1. **إنشاء الأنظمة الذكية**:
   - نظام التوصيات الذكية
   - نظام الإشعارات الذكية  
   - نظام التحليلات الذكية
   - نظام التكامل الشامل

2. **دمج النظام في التطبيق**:
   - إضافة `SmartSystemsProvider` في `app/_layout.tsx`
   - إنشاء hook `useSmartSystems` للاستخدام السهل

3. **استخدام النظام في الشاشات**:
   - شاشة الاستكشاف: تتبع عرض المنتجات والبحث
   - شاشة السلة: تتبع عمليات الشراء

### كيفية الاستخدام:

#### 1. في أي شاشة:
```typescript
import { useSmartSystems } from '@/providers/SmartSystemsProvider';

const MyScreen = () => {
  const { trackEvent, getRecommendations, sendNotification } = useSmartSystems();
  
  // تتبع حدث
  trackEvent('custom_event', { data: 'value' });
  
  // الحصول على توصيات
  const recommendations = getRecommendations('user-id', 5);
  
  // إرسال إشعار
  sendNotification('user-id', 'رسالة الإشعار', 'success');
};
```

#### 2. الأحداث المتاحة للتتبع:
- `product_view`: عرض منتج
- `add_to_cart`: إضافة للسلة
- `search`: البحث
- `checkout_started`: بداية الشراء
- `checkout_completed`: إتمام الشراء

#### 3. أنواع الإشعارات:
- `info`: معلومات
- `success`: نجاح
- `warning`: تحذير
- `error`: خطأ

### الملفات المهمة:
- `providers/SmartSystemsProvider.tsx`: مزود النظام
- `utils/smartIntegration.ts`: النظام الرئيسي
- `utils/smartRecommendations.ts`: التوصيات
- `utils/smartNotifications.ts`: الإشعارات
- `utils/smartAnalytics.ts`: التحليلات

### الخطوات التالية:
1. استخدم `trackEvent` لتتبع سلوك المستخدم
2. استخدم `getRecommendations` لعرض توصيات مخصصة
3. استخدم `sendNotification` لإرسال إشعارات ذكية
4. راجع التحليلات من خلال `getAnalytics`

🎉 **الأنظمة الذكية جاهزة للاستخدام!** 