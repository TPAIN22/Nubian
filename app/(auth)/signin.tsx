import { useCallback, useState } from 'react';
import { View, Alert, ActivityIndicator, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Text } from '@/components/ui/text';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useSSO, useSignIn } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import i18n from '../../utils/i18n';

WebBrowser.maybeCompleteAuthSession();

const AuthSheet = () => {
  const [loading, setLoading] = useState<'google' | 'facebook' | 'email' | null>(null);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [emailAddressId, setEmailAddressId] = useState<string | null>(null);
  
  const router = useRouter();
  const { startSSOFlow } = useSSO();
  const { signIn, isLoaded, setActive } = useSignIn();

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
        Alert.alert(i18n.t('error'), i18n.t('failedToSignIn'));
      }
    } finally {
      setLoading(null);
    }
  }, [startSSOFlow, redirectUrl, router]);

  // Email sign-in handler
  const handleEmail = useCallback(async () => {
    if (!isLoaded || !signIn) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      Alert.alert(i18n.t('error'), i18n.t('pleaseEnterValidEmail'));
      return;
    }

    try {
      setLoading('email');
      
      // إنشاء محاولة تسجيل الدخول
      const signInAttempt = await signIn.create({ 
        identifier: trimmedEmail 
      });

      // الحصول على email address ID من الـ response
      const emailFactor = signInAttempt.supportedFirstFactors?.find(
        (factor) => factor.strategy === "email_code"
      );
      const emailAddressIdFromFactor =
        (emailFactor as any)?.emailAddressId ?? (emailFactor as any)?.email_address_id ?? null;

      if (!emailAddressIdFromFactor) {
        Alert.alert(i18n.t('error'), i18n.t('failedToSignIn'));
        return;
      }

      // طلب إرسال كود تحقق
      await signIn.prepareFirstFactor({
        strategy: 'email_code',
        emailAddressId: emailAddressIdFromFactor,
      });

      Alert.alert('📩', i18n.t('emailSend'));
      setEmailAddressId(emailAddressIdFromFactor);
      setPendingVerification(true);
    } catch (err: any) {
      const errorMessage = err.errors?.[0]?.message || i18n.t('failedToSignIn');
      Alert.alert(i18n.t('error'), errorMessage);
    } finally {
      setLoading(null);
    }
  }, [email, isLoaded, signIn]);
  // التحقق من الكود
  const handleVerifyCode = useCallback(async () => {
    if (!isLoaded || !signIn) return;

    if (code.length < 6) {
      Alert.alert(i18n.t('error'), i18n.t('invalidCode'));
      return;
    }

    try {
      setLoading('email');
      const attempt = await signIn.attemptFirstFactor({
        strategy: 'email_code',
        code: code.trim(),
      });

      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId });
        Alert.alert('🎉', i18n.t('signInSuccess'));
        router.replace('/');
      } else {
        Alert.alert(i18n.t('error'), i18n.t('invalidOrExpiredCode'));
      }
    } catch (err: any) {
      const errorMessage = err.errors?.[0]?.message || i18n.t('codeVerificationFailed');
      Alert.alert(i18n.t('error'), errorMessage);
    } finally {
      setLoading(null);
    }
  }, [code, isLoaded, signIn, setActive, router]);

  // إعادة إرسال الكود
  const handleResendCode = useCallback(async () => {
    if (!isLoaded || !signIn) return;

    try {
      setLoading('email');
      await signIn.prepareFirstFactor({
        strategy: 'email_code',
        emailAddressId:
          emailAddressId ??
          ((signIn.supportedFirstFactors?.find((factor) => factor.strategy === "email_code") as any)
            ?.emailAddressId ?? ""),
      });
      Alert.alert('✅', i18n.t('codeResent'));
    } catch {
      Alert.alert(i18n.t('error'), i18n.t('resendFailed'));
    } finally {
      setLoading(null);
    }
  }, [emailAddressId, isLoaded, signIn]);

  return (
    <View style={styles.container}>
      <View style={styles.backdrop}>
        <Image 
          style={styles.backdropImage} 
          source={require('../../assets/images/nubianLogo.png')}
          contentFit="cover"
        />
      </View>

      {/* Header */}
      <Text style={styles.title}>{i18n.t('signInTitle')}</Text>
      <Text style={styles.subtitle}>{i18n.t('signInSubtitle')}</Text>

      {/* Google Button */}
      <TouchableOpacity
        style={[styles.btn, styles.googleBtn]}
        onPress={() => handleOAuth('google')}
        disabled={loading !== null}
        activeOpacity={0.7}
      >
        {loading === 'google' ? (
          <ActivityIndicator color="#666" />
        ) : (
          <>
            <Image 
              style={styles.icon} 
              source={require('../../assets/images/google.svg')}
              contentFit="contain"
            />
            <Text style={styles.googleBtnText}>Google</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Facebook Button */}
      <TouchableOpacity
        style={[styles.btn, styles.fbBtn]}
        onPress={() => handleOAuth('facebook')}
        disabled={loading !== null}
        activeOpacity={0.7}
      >
        {loading === 'facebook' ? (
          <ActivityIndicator color="#666" />
        ) : (
          <>
            <Image 
              style={styles.icon} 
              source={require('../../assets/images/facebook.png')}
              contentFit="contain"
            />
            <Text style={styles.fbBtnText}>Facebook</Text>
          </>
        )}
      </TouchableOpacity>
      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.orText}>{i18n.t('or')}</Text>
        <View style={styles.line} />
      </View>
      {!pendingVerification ? (
        <>
          {/* Email Input */}
          <TextInput
            style={styles.input}
            placeholder={i18n.t('yourEmail')}
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            editable={loading === null}
            textAlign="right"
          />
          {/* Send code button */}
          <TouchableOpacity
            style={[styles.btn, styles.emailBtn]}
            onPress={handleEmail}
            disabled={loading !== null || !email}
            activeOpacity={0.7}
          >
            {loading === 'email' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>{i18n.t('signIn')}</Text>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <>
          {/* Verification code input */}
          <TextInput
            style={styles.input}
            placeholder={i18n.t('enterCodeSent')}
            keyboardType="number-pad"
            value={code}
            onChangeText={setCode}
            textAlign="center"
            maxLength={6}
          />

          {/* Verify button */}
          <TouchableOpacity
            style={[styles.btn, styles.emailBtn]}
            onPress={handleVerifyCode}
            disabled={loading !== null || !code}
            activeOpacity={0.7}
          >
            {loading === 'email' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>{i18n.t('verifyAndSignIn')}</Text>
            )}
          </TouchableOpacity>

          {/* Resend code */}
          <TouchableOpacity
            onPress={handleResendCode}
            disabled={loading !== null}
            style={styles.resendBtn}
          >
            <Text style={styles.resendText}>{i18n.t('resendCode')}</Text>
          </TouchableOpacity>

          {/* Back button */}
          <TouchableOpacity
            onPress={() => {
              setPendingVerification(false);
              setCode('');
            }}
            style={styles.backBtn}
          >
            <Text style={styles.backText}>{i18n.t('changeEmail')}</Text>
          </TouchableOpacity>
        </>
      )}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {i18n.t('dontHaveAccount')}{' '}
        </Text>
          <Text
            style={styles.footerLink}
            onPress={() => router.push('/signup')}
          >
            {i18n.t('createNewAccount')}
          </Text>
      </View>
       <Text style={styles.termsText}>
            {i18n.t('bySigningUpAgree')}{' '}
            <Text style={styles.link}>{i18n.t('termsAndConditions')}</Text>
            {i18n.t('and')}
            <Text style={styles.link}>{i18n.t('privacyPolicy')}</Text>
        </Text>
    </View>
  );
};
export default AuthSheet;
const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff',
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
    marginTop: 100,
    width: 120,
    height: 120,
    resizeMode: 'cover', 
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
    color: '#000',
    textAlign: 'center',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
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
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  fbBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  emailBtn: {
    backgroundColor: '#000',
  },
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
    backgroundColor: '#e0e0e0',
  },
  orText: {
    color: '#999',
    paddingHorizontal: 12,
    fontSize: 14,
  },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#fafafa',
    color: '#000',
  },
  resendBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  resendText: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '500',
  },
  backBtn: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  backText: {
    color: '#999',
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  footerText: {
    fontSize: 16,
    color: '#666',
  },
  footerLink: {
    fontSize: 14,
    color: '#007AFF',
  },
  link: {
    color: '#007AFF',
  },
  termsText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
});