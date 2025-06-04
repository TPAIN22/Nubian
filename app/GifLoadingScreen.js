import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image'; // مهم: استورد Image من expo-image
import { StatusBar } from 'expo-status-bar';

export default function GifLoadingScreen({ onAnimationFinish }) {
  // استخدام useEffect لتحديد مدة عرض الـ GIF
  useEffect(() => {
    const timer = setTimeout(() => {
      onAnimationFinish(); // استدعاء الدالة لإنهاء شاشة الـ GIF
    }, 3000); // 3000 ملي ثانية = 3 ثواني. قم بتعديل هذه المدة حسب طول الـ GIF الخاص بك ورغبتك.

    // دالة التنظيف لإلغاء الـ timer إذا تم إلغاء تحميل المكون قبل انتهاء الوقت
    return () => clearTimeout(timer);
  }, []); // onAnimationFinish كـ dependency لضمان التنفيذ الصحيح

  return (
    <>
    <StatusBar style="dark" />
    <View style={styles.container}>
      {/* تأكد من وضع ملف الـ GIF الخاص بك في مجلد assets/ */}
      <Image
        source={require('../assets/images/logo.gif')} // **غير هذا المسار ليتطابق مع ملف الـ GIF الخاص بك**
        style={styles.gif}
        contentFit="contain" // عرض الـ GIF بالكامل داخل المساحة المحددة
        // contentFit="cover" // يمكنك استخدام cover لملء المساحة وقص الزوائد
      />
      {/* <ActivityIndicator size="large" color="#0000ff" style={styles.indicator} /> */}
    </View>
        </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // **مهم: ضع هنا نفس لون خلفية شاشة البداية الأصلية (المحددة في app.json)**
  },
  gif: {
    width: 300, // عدّل الأبعاد هذه لتناسب حجم الـ GIF الذي تريد عرضه
    height: 300,
  },
  indicator: {
    marginTop: 20,
  },
});