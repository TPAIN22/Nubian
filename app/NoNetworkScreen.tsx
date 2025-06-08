import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

export default function NoNetworkScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <>
      <StatusBar style="light" />
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <View style={styles.wifiIcon}>
              <View style={[styles.wifiBar, styles.bar1]} />
              <View style={[styles.wifiBar, styles.bar2]} />
              <View style={[styles.wifiBar, styles.bar3]} />
              <View style={styles.wifiSlash} />
            </View>
          </View>

          <Text style={styles.title}>لا يوجد اتصال بالإنترنت</Text>
          <Text style={styles.message}>
            تأكد من اتصالك بشبكة Wi-Fi أو تفعيل البيانات الخلوية، ثم حاول مرة أخرى
          </Text>

          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
          </TouchableOpacity>

          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>نصائح للحل:</Text>
            <Text style={styles.tipText}>• تأكد من تشغيل Wi-Fi أو البيانات الخلوية</Text>
            <Text style={styles.tipText}>• جرب الاقتراب من جهاز التوجيه</Text>
            <Text style={styles.tipText}>• أعد تشغيل التطبيق</Text>
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: width * 0.85,
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    marginBottom: 40,
  },
  wifiIcon: {
    width: 80,
    height: 80,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wifiBar: {
    position: 'absolute',
    backgroundColor: '#e98c22',
    borderRadius: 4,
  },
  bar1: {
    width: 60,
    height: 8,
    bottom: 10,
    opacity: 0.3,
  },
  bar2: {
    width: 45,
    height: 8,
    bottom: 25,
    opacity: 0.5,
  },
  bar3: {
    width: 30,
    height: 8,
    bottom: 40,
    opacity: 0.7,
  },
  wifiSlash: {
    position: 'absolute',
    width: 3,
    height: 70,
    backgroundColor: '#e98c22',
    transform: [{ rotate: '45deg' }],
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'System',
  },
  message: {
    fontSize: 18,
    color: '#b0b0b0',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#3498db',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginBottom: 40,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  tipsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  tipText: {
    fontSize: 14,
    color: '#b0b0b0',
    lineHeight: 22,
    marginBottom: 8,
    textAlign: 'right',
  },
});