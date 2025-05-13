import React, { useCallback, useEffect, useState } from 'react';
import { View, Alert, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useSSO } from '@clerk/clerk-expo';
import * as Linking from 'expo-linking';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

const useWarmUpBrowser = () => {
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

WebBrowser.maybeCompleteAuthSession();

export default function GoogleSignInButton() {
  useWarmUpBrowser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const { startSSOFlow } = useSSO();

  const redirectUrl = Linking.createURL('sso-callback');
  
  const handleSignIn = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('بدء تدفق SSO مع عنوان إعادة التوجيه:', redirectUrl);
      
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl,
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        console.log('تم إنشاء جلسة بنجاح مع المعرف:', createdSessionId);
        Alert.alert('نجاح', 'تم تسجيل الدخول بنجاح!');
        router.replace('/');
      } else {
        console.log('لم يتم إنشاء جلسة أو تم إلغاء العملية');
      }
    } catch (err: any) {
      console.error('خطأ في OAuth:', JSON.stringify(err, null, 2));
      setError(err.message || 'حدث خطأ أثناء تسجيل الدخول');
      Alert.alert('خطأ', 'حدث خطأ أثناء تسجيل الدخول. الرجاء المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  }, [startSSOFlow, redirectUrl]);

  useEffect(() => {
    if (error) {
      console.log('تم تعيين حالة الخطأ:', error);
    }
  }, [error]);

  return (
    <View style={styles.container}>
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      <Image style={{ width: '100%', height: 400 }} source={require("../../assets/images/login.gif")}/>
      <Text style={styles.infoText}>
        انت الان على بعد خطوة واحدة من تسجيل الدخول{"\n"} اضغط على الزر للمتابعة
      </Text>
      <TouchableOpacity 
        style={styles.googleButton}
        onPress={handleSignIn}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
        <View style={styles.googleButtonContent}>
          <Image style={{ width: 20, height: 20 ,tintColor: '#fff'}} source={require("../../assets/images/google.svg")}/>
          <Text style={styles.buttonText}>المتابعة باستخدام {' '} google</Text>
        </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    flex: 1
  },
  googleButton: {
    backgroundColor: '#AD8B19',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 220,
    width: '90%',
    position: 'absolute',
    bottom: 50,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 20,
    textAlign: 'center',
    color: '#1b1b1ba3',
    marginVertical: 20,
    fontWeight: '600',
  },
});