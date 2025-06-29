#!/usr/bin/env node

/**
 * سكريبت تشغيل عرض الأنظمة الذكية
 * يعرض كيفية عمل الأنظمة الذكية في تطبيق Nubian
 */

const { runSmartSystemsExample } = require('../examples/smart-systems-usage');

console.log(`
🧠 ========================================
   عرض الأنظمة الذكية في تطبيق Nubian
   Smart Systems Demo - Nubian App
========================================

هذا العرض سيوضح كيفية عمل الأنظمة الذكية:
1. نظام التوصيات الذكي
2. نظام الإشعارات الذكي  
3. نظام التحليلات الذكي
4. نظام التكامل الذكي

========================================
`);

// تشغيل العرض
runSmartSystemsExample();

console.log(`
📚 ========================================
   معلومات إضافية:
========================================

📖 الدليل الكامل: docs/smart-systems-guide.md
🧪 الاختبارات: __tests__/smart-systems.test.js
💻 المثال: examples/smart-systems-usage.js

🔧 الأوامر المتاحة:
- npm run test:smart-systems    # تشغيل اختبارات الأنظمة الذكية
- npm run performance-check     # فحص الأداء
- npm run backup               # إنشاء نسخة احتياطية

========================================
`); 