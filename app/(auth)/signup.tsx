import { useCallback, useState } from 'react';
import { toast } from 'sonner-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useSSO, useSignUp } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import i18n from '@/utils/i18n';
import { useTheme } from '@/providers/ThemeProvider';
import { useTracking } from '@/hooks/useTracking';
import { completeSSOFlow, ssoBrowserSucceeded } from '@/utils/ssoFlow';
import {
  AuthScaffold,
  AuthCard,
  ProviderButton,
  PrimaryButton,
  AuthTextField,
  AuthDivider,
  TermsFooter,
  AuthTextButton,
  AuthLinkRow,
} from '@/components/auth';

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
  const { mergeSession } = useTracking();

  const finalizeSignedIn = useCallback(async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    await AsyncStorage.removeItem('isGuest');
    await mergeSession();
    router.replace('/(tabs)');
  }, [mergeSession, router]);

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

      if (await completeSSOFlow(result)) {
        await finalizeSignedIn();
      } else if (ssoBrowserSucceeded(result)) {
        // OAuth succeeded in the browser but no session was created —
        // don't fail silently
        toast.error(i18n.t('errorCreatingAccount'));
      }
    } catch (err: any) {
      if (__DEV__) {
        console.error('[SSO] sign-up error', JSON.stringify(err, null, 2));
      }
      if (err?.code !== 'oauth_access_denied') {
        toast.error(i18n.t('errorCreatingAccount'));
      }
    } finally {
      setLoading(null);
    }
  }, [startSSOFlow, redirectUrl, finalizeSignedIn]);

  // Email sign-up handler
  const handleEmail = useCallback(async () => {
    if (!isLoaded || !signUp) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      toast.error(i18n.t('pleaseEnterValidEmail'));
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

      toast.success(i18n.t('verificationCodeSent'));
      setPendingVerification(true);
    } catch (err: any) {
      console.error('Sign-up error:', err);
      const errorMessage = err.errors?.[0]?.message || i18n.t('errorCreateAcount');

      if (errorMessage.includes('already exists') || errorMessage.includes('taken')) {
        toast.error(i18n.t('emailTaken'));
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(null);
    }
  }, [email, isLoaded, signUp]);

  // التحقق من الكود
  const handleVerifyCode = useCallback(async () => {
    if (!isLoaded || !signUp) return;

    if (code.length < 6) {
      toast.error(i18n.t('invalidCode'));
      return;
    }

    try {
      setLoading('email');
      const result = await signUp.attemptEmailAddressVerification({
        code: code.trim(),
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        toast.success(i18n.t('successCreateAcount'));
        await finalizeSignedIn();
      } else {
        toast.error(i18n.t('invalidCode'));
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      const errorMessage = err.errors?.[0]?.message || i18n.t('codeExpired');
      toast.error(errorMessage);
    } finally {
      setLoading(null);
    }
  }, [code, isLoaded, signUp, setActive, finalizeSignedIn]);

  // إعادة إرسال الكود
  const handleResendCode = useCallback(async () => {
    if (!isLoaded || !signUp) return;

    try {
      setLoading('email');
      await signUp.prepareEmailAddressVerification({
        strategy: 'email_code',
      });
      toast.success(i18n.t('codeResent'));
    } catch {
      toast.error(i18n.t('failedToResendCode'));
    } finally {
      setLoading(null);
    }
  }, [isLoaded, signUp]);

  const busy = loading !== null;

  return (
    <AuthScaffold
      title={i18n.t('signUp')}
      subtitle={i18n.t('signUpSubtitle')}
      footer={<TermsFooter leadKey="signUpTerms" />}
    >
      <AuthCard>
        {!pendingVerification ? (
          <>
            <ProviderButton
              onPress={() => handleOAuth('google')}
              disabled={busy}
              loading={loading === 'google'}
              label={i18n.t('signUpWithGoogle') || 'Google'}
              background={colors.cardBackground}
              borderColor={colors.borderLight}
              textColor={colors.text.gray}
              icon={
                <Image
                  source={require('../../assets/images/google.svg')}
                  style={{ width: 22, height: 22 }}
                  contentFit="contain"
                />
              }
            />
            <ProviderButton
              onPress={() => handleOAuth('facebook')}
              disabled={busy}
              loading={loading === 'facebook'}
              label={i18n.t('signUpWithFacebook') || 'Facebook'}
              background={colors.cardBackground}
              borderColor={colors.borderLight}
              textColor={colors.text.gray}
              icon={
                <Image
                  source={require('../../assets/images/facebook.png')}
                  style={{ width: 22, height: 22 }}
                  contentFit="contain"
                />
              }
            />

            <AuthDivider />

            <AuthTextField
              placeholder={i18n.t('email')}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
              editable={!busy}
            />
            <PrimaryButton
              label={i18n.t('signUp')}
              icon="mail-outline"
              loading={loading === 'email'}
              disabled={!email}
              onPress={handleEmail}
            />

            <AuthLinkRow
              prompt={i18n.t('alreadyHaveAnAccount')}
              action={i18n.t('signIn')}
              onPress={() => router.push('/signin')}
            />
          </>
        ) : (
          <>
            <AuthTextField
              centered
              placeholder={i18n.t('inputCode')}
              keyboardType="number-pad"
              value={code}
              onChangeText={setCode}
              maxLength={6}
              editable={!busy}
            />
            <PrimaryButton
              label={i18n.t('verify')}
              loading={loading === 'email'}
              disabled={!code}
              onPress={handleVerifyCode}
            />
            <AuthTextButton
              label={i18n.t('resendCode')}
              onPress={handleResendCode}
              disabled={busy}
            />
            <AuthTextButton
              label={i18n.t('changeEmail')}
              tone="muted"
              onPress={() => {
                setPendingVerification(false);
                setCode('');
              }}
            />
          </>
        )}
      </AuthCard>
    </AuthScaffold>
  );
};

export default SignUpSheet;
