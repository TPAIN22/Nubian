import React, { useCallback, useState } from 'react';
import { View, Alert, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useSSO } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import i18n from '../../utils/i18n';

WebBrowser.maybeCompleteAuthSession();

const GoogleSignInSheet = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { startSSOFlow } = useSSO();

  const redirectUrl = AuthSession.makeRedirectUri({
    native: 'sdnubian://sso-callback',
  });

  const handleSignIn = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

          
      

      const ssoResult = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl,
      });


      const { createdSessionId, setActive, signUp, signIn } = ssoResult;

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        await AsyncStorage.setItem('pendingSessionId', createdSessionId);
        
        // تحديد نوع العملية
        if (signUp) {
          
          
          Alert.alert(
            'مرحباً! 🎉', 
            'تم إنشاء حسابك الجديد بنجاح. مرحباً بك في التطبيق!'
          );
        } else if (signIn) {
          
          
          Alert.alert(
            'مرحباً بعودتك! 👋', 
            'تم تسجيل دخولك بنجاح'
          );
        } else {
          
          
          
          Alert.alert(
            i18n.t('alertSuccessTitle'), 
            i18n.t('alertSuccessMessage')
          );
        }
        
        router.replace('/');
      } else {
        
        
        
        throw new Error('فشل في إنشاء جلسة المستخدم');
      }
    } catch (err: any) {
  
      
      let errorMessage = i18n.t('signInError');
      
      // معالجة أخطاء محددة
      if (err?.code === 'sign_up_not_allowed') {
        errorMessage = 'تسجيل الحسابات الجديدة غير مسموح حالياً';
      } else if (err?.code === 'oauth_access_denied') {
        errorMessage = 'تم إلغاء عملية التسجيل';
      } else if (err?.message?.includes('sign_up')) {
        errorMessage = 'مشكلة في إنشاء الحساب الجديد';
      }
      
      setError(errorMessage);
      Alert.alert(
        i18n.t('alertErrorTitle'), 
        errorMessage
      );
    } finally {
      setIsLoading(false);
    }
  }, [startSSOFlow, redirectUrl, router]);

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      <Text style={styles.infoText}>
        {i18n.t('signInGooglePrompt')}
      </Text>
      
      <Text style={styles.subInfoText}>
        سيتم إنشاء حساب جديد تلقائياً إذا لم يكن لديك حساب مسبق
      </Text>
      
      <TouchableOpacity
        style={[styles.googleButton, isLoading && styles.googleButtonDisabled]}
        onPress={handleSignIn}
        disabled={isLoading}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.loadingText}>جاري المعالجة...</Text>
          </View>
        ) : (
          <View style={styles.googleButtonContent}>
            <Image 
              style={styles.googleIcon} 
              source={require("../../assets/images/google.svg")} 
            />
            <Text style={styles.buttonText}>
              {i18n.t('continueWithGoogle')}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default GoogleSignInSheet;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    paddingBottom: 40,
    borderRadius: 20,
  },
  googleButton: {
    backgroundColor: '#f0b745',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  googleButtonDisabled: {
    backgroundColor: '#f0b74580',
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  googleIcon: {
    width: 20,
    height: 20,
    tintColor: '#fff',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  infoText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#1b1b1ba3',
    marginVertical: 20,
    fontWeight: '600',
  },
  subInfoText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 10,
    fontStyle: 'italic',
  },
});