import { useCallback, useState } from 'react';
import { View, Alert, ActivityIndicator, StyleSheet, TouchableOpacity, TextInput, I18nManager } from 'react-native';
import { Text } from '@/components/ui/text';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useSSO, useSignUp } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import i18n from '@/utils/i18n';
import { useTheme } from '@/providers/ThemeProvider';

WebBrowser.maybeCompleteAuthSession();

const SignUpSheet = () => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const [loading, setLoading] = useState<'google' | 'facebook' | 'email' | null>(null);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  
  const router = useRouter();
  const { startSSOFlow } = useSSO();
  const { signUp, isLoaded, setActive } = useSignUp();

  const redirectUrl = AuthSession.makeRedirectUri({
    native: 'sdnubian://sso-callback',
  });

  // Unified OAuth handler
  const handleOAuth = useCallback(async (provider: 'google' | 'facebook') => {
    try {
      setLoading(provider);
      const result = await startSSOFlow({
        strategy: `oauth_${provider}`,
        redirectUrl,
      });

      if (result.createdSessionId && result.setActive) {
        await result.setActive({ session: result.createdSessionId });
        await AsyncStorage.setItem('pendingSessionId', result.createdSessionId);
        router.replace('/');
      }
    } catch (err: any) {
      if (err?.code !== 'oauth_access_denied') {
        Alert.alert(i18n.t('error'), i18n.t('errorCreatingAccount'));
      }
    } finally {
      setLoading(null);
    }
  }, [startSSOFlow, redirectUrl, router]);

  // Email sign-up handler
  const handleEmail = useCallback(async () => {
    if (!isLoaded || !signUp) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      Alert.alert(i18n.t('error'), i18n.t('pleaseEnterValidEmail'));
      return;
    }

    try {
      setLoading('email');
      
      // إنشاء حساب جديد
      await signUp.create({
        emailAddress: trimmedEmail,
      });

      // طلب إرسال كود تحقق للبريد
      await signUp.prepareEmailAddressVerification({
        strategy: 'email_code',
      });

      Alert.alert('📩', i18n.t('verificationCodeSent'));
      setPendingVerification(true);
    } catch (err: any) {
      console.error('Sign-up error:', err);
      const errorMessage = err.errors?.[0]?.message || i18n.t('errorCreateAcount');
      
      // رسائل خطأ مخصصة
      if (errorMessage.includes('already exists')) {
        Alert.alert(i18n.t('error'), i18n.t('emailTaken'));
      } else {
       if (errorMessage.includes('taken'))
         Alert.alert(i18n.t('error'), i18n.t('emailTaken'));
      }
    } finally {
      setLoading(null);
    }
  }, [email, isLoaded, signUp]);

  // التحقق من الكود
  const handleVerifyCode = useCallback(async () => {
    if (!isLoaded || !signUp) return;

    if (code.length < 6) {
      Alert.alert(i18n.t('error'), i18n.t('invalidCode'));
      return;
    }

    try {
      setLoading('email');
      const result = await signUp.attemptEmailAddressVerification({
        code: code.trim(),
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        Alert.alert('🎉', i18n.t('successCreateAcount'));
        router.replace('/');
      } else {
        Alert.alert(i18n.t('error'), i18n.t('invalidCode'));
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      const errorMessage = err.errors?.[0]?.message || i18n.t('codeExpired');
      Alert.alert(i18n.t('error'), errorMessage);
    } finally {
      setLoading(null);
    }
  }, [code, isLoaded, signUp, setActive, router]);

  // إعادة إرسال الكود
  const handleResendCode = useCallback(async () => {
    if (!isLoaded || !signUp) return;

    try {
      setLoading('email');
      await signUp.prepareEmailAddressVerification({
        strategy: 'email_code',
      });
      Alert.alert('✅', i18n.t('codeResent'));
    } catch {
      Alert.alert(i18n.t('error'), i18n.t('failedToResendCode'));
    } finally {
      setLoading(null);
    }
  }, [isLoaded, signUp]);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.backdrop}>
        <Image
          style={styles.backdropImage}
          source={require('../../assets/images/nubianLogo.png')}
          contentFit="cover"
        />
      </View>
      {/* Header */}
      <Text style={[styles.title, { color: colors.text.gray }]}>{i18n.t('signUp')}</Text>
      <Text style={[styles.subtitle, { color: colors.text.veryLightGray }]}>{i18n.t('signUpSubtitle')}</Text>

      {/* Google Button */}
      <TouchableOpacity
        style={[styles.btn, styles.googleBtn, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}
        onPress={() => handleOAuth('google')}
        disabled={loading !== null}
        activeOpacity={0.7}
      >
        {loading === 'google' ? (
          <ActivityIndicator color={colors.text.veryLightGray} />
        ) : (
          <>
            <Image 
              style={styles.icon} 
              source={require('../../assets/images/google.svg')}
              contentFit="contain"
            />
            <Text style={styles.googleBtnText}>{i18n.t('signUpWithGoogle')}</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Facebook Button */}
      <TouchableOpacity
        style={[styles.btn, styles.fbBtn, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}
        onPress={() => handleOAuth('facebook')}
        disabled={loading !== null}
        activeOpacity={0.7}
      >
        {loading === 'facebook' ? (
          <ActivityIndicator color={colors.text.veryLightGray} />
        ) : (
          <>
            <Image 
              style={styles.icon} 
              source={require('../../assets/images/facebook.png')}
              contentFit="contain"
            />
            <Text style={styles.fbBtnText}>{i18n.t('signUpWithFacebook')}</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.divider}>
        <View style={[styles.line, { backgroundColor: colors.borderLight }]} />
        <Text style={[styles.orText, { color: colors.text.veryLightGray }]}>{i18n.t('or')}</Text>
        <View style={[styles.line, { backgroundColor: colors.borderLight }]} />
      </View>

      {!pendingVerification ? (
        <>
          {/* Email Input */}
          <TextInput
            style={[styles.input, { borderColor: colors.borderLight, backgroundColor: colors.surface, color: colors.text.gray }]}
            placeholder={typeof i18n.t('email') === 'string' ? i18n.t('email') : ''}
            placeholderTextColor={colors.text.veryLightGray}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            editable={loading === null}
            textAlign={I18nManager.isRTL ? 'right' : 'left'}
          />

          {/* Sign up button */}
          <TouchableOpacity
            style={[styles.btn, styles.emailBtn, { backgroundColor: colors.primary }]}
            onPress={handleEmail}
            disabled={loading !== null || !email}
            activeOpacity={0.7}
          >
            {loading === 'email' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>{i18n.t('signUp')}</Text>
            )}
          </TouchableOpacity>
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.text.veryLightGray }]}>
              {i18n.t('alreadyHaveAnAccount')}{' '}
            </Text>
            <Text style={[styles.footerLink, { color: colors.primary }]} onPress={() => router.push('/signin')}>
              {i18n.t('signIn')}
            </Text>
          </View>

          {/* Terms */}
          <Text style={[styles.termsText, { color: colors.text.veryLightGray }]}>
            {i18n.t('signUpTerms')}{' '}
            <Text style={[styles.link, { color: colors.primary }]}>{i18n.t('termsAndConditions')}</Text>
            {i18n.t('and')}{' '}
            <Text style={[styles.link, { color: colors.primary }]}>{i18n.t('privacyPolicy')}</Text>
          </Text>
        </>
      ) : (
        <>
          {/* Verification code input */}
          <TextInput
            style={[styles.input, { borderColor: colors.borderLight, backgroundColor: colors.surface, color: colors.text.gray }]}
            placeholder={typeof i18n.t('inputCode') === 'string' ? i18n.t('inputCode') : ''}
            placeholderTextColor={colors.text.veryLightGray}
            keyboardType="number-pad"
            value={code}
            onChangeText={setCode}
            textAlign="center"
            maxLength={6}
          />

          {/* Verify button */}
          <TouchableOpacity
            style={[styles.btn, styles.emailBtn, { backgroundColor: colors.primary }]}
            onPress={handleVerifyCode}
            disabled={loading !== null || !code}
            activeOpacity={0.7}
          >
            {loading === 'email' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>{i18n.t('verify')}</Text>
            )}
          </TouchableOpacity>

          {/* Resend code */}
          <TouchableOpacity
            onPress={handleResendCode}
            disabled={loading !== null}
            style={styles.resendBtn}
          >
            <Text style={[styles.resendText, { color: colors.primary }]}>{i18n.t('resendCode')}</Text>
          </TouchableOpacity>

          {/* Back button */}
          <TouchableOpacity
            onPress={() => {
              setPendingVerification(false);
              setCode('');
            }}
            style={styles.backBtn}
          >
            <Text style={[styles.backText, { color: colors.text.veryLightGray }]}>{i18n.t('changeEmail')}</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

export default SignUpSheet;

const styles = StyleSheet.create({
  container: {
    padding: 24,
    borderRadius: 20,
    gap: 16,
    flex: 1,
    justifyContent: 'center',
  },
  backdrop: {
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdropImage: {
    marginTop: 32,
    width: 80,
    height: 80,
    resizeMode: 'cover',
    marginBottom: 24,
  },
  googleBtnText: {
    color: '#707070',
    fontSize: 16,
    fontWeight: '600',
  },
  fbBtnText: {
    color: '#707070',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 8,
  },
  btn: {
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  googleBtn: {
    borderWidth: 1,
  },
  fbBtn: {
    borderWidth: 1,
  },
  emailBtn: {},
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  icon: {
    width: 22,
    height: 22,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  line: {
    flex: 1,
    height: 1,
  },
  orText: {
    paddingHorizontal: 12,
    fontSize: 14,
  },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  resendBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  resendText: {
    fontSize: 15,
    fontWeight: '500',
  },
  backBtn: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  backText: {
    fontSize: 14,
  },
  termsText: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginTop: 8,
  },
  link: {
    textDecorationLine: 'underline',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 8,
  },
  footerText: {
    fontSize: 13,
  },
  footerLink: {
    textDecorationLine: 'underline',
  },
});