import { useCallback, useState } from 'react';
import { toast } from 'sonner-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useSSO, useSignIn } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import i18n from '../../utils/i18n';
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

const AuthSheet = () => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const [loading, setLoading] = useState<'google' | 'facebook' | 'email' | null>(null);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [emailAddressId, setEmailAddressId] = useState<string | null>(null);

  const router = useRouter();
  const { startSSOFlow } = useSSO();
  const { signIn, isLoaded, setActive } = useSignIn();
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
        toast.error(i18n.t('failedToSignIn'));
      }
    } catch (err: any) {
      if (__DEV__) {
        console.error('[SSO] sign-in error', JSON.stringify(err, null, 2));
      }
      if (err?.code !== 'oauth_access_denied') {
        toast.error(i18n.t('failedToSignIn'));
      }
    } finally {
      setLoading(null);
    }
  }, [startSSOFlow, redirectUrl, finalizeSignedIn]);

  // Email sign-in handler
  const handleEmail = useCallback(async () => {
    if (!isLoaded || !signIn) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      toast.error(i18n.t('pleaseEnterValidEmail'));
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
        toast.error(i18n.t('failedToSignIn'));
        return;
      }

      // طلب إرسال كود تحقق
      await signIn.prepareFirstFactor({
        strategy: 'email_code',
        emailAddressId: emailAddressIdFromFactor,
      });

      toast.success(i18n.t('emailSend'));
      setEmailAddressId(emailAddressIdFromFactor);
      setPendingVerification(true);
    } catch (err: any) {
      const errorMessage = err.errors?.[0]?.message || i18n.t('failedToSignIn');
      toast.error(errorMessage);
    } finally {
      setLoading(null);
    }
  }, [email, isLoaded, signIn]);

  // التحقق من الكود
  const handleVerifyCode = useCallback(async () => {
    if (!isLoaded || !signIn) return;

    if (code.length < 6) {
      toast.error(i18n.t('invalidCode'));
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
        toast.success(i18n.t('signInSuccess'));
        await finalizeSignedIn();
      } else {
        toast.error(i18n.t('invalidOrExpiredCode'));
      }
    } catch (err: any) {
      const errorMessage = err.errors?.[0]?.message || i18n.t('codeVerificationFailed');
      toast.error(errorMessage);
    } finally {
      setLoading(null);
    }
  }, [code, isLoaded, signIn, setActive, finalizeSignedIn]);

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
      toast.success(i18n.t('codeResent'));
    } catch {
      toast.error(i18n.t('resendFailed'));
    } finally {
      setLoading(null);
    }
  }, [emailAddressId, isLoaded, signIn]);

  const busy = loading !== null;

  return (
    <AuthScaffold
      title={i18n.t('signInTitle')}
      subtitle={i18n.t('signInSubtitle')}
      footer={<TermsFooter leadKey="bySigningUpAgree" />}
    >
      <AuthCard>
        {!pendingVerification ? (
          <>
            <ProviderButton
              onPress={() => handleOAuth('google')}
              disabled={busy}
              loading={loading === 'google'}
              label={i18n.t('signInWithGoogle') || 'Google'}
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
              label={i18n.t('signInWithFacebook') || 'Facebook'}
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
              placeholder={i18n.t('yourEmail')}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
              editable={!busy}
            />
            <PrimaryButton
              label={i18n.t('signIn')}
              icon="mail-outline"
              loading={loading === 'email'}
              disabled={!email}
              onPress={handleEmail}
            />

            <AuthLinkRow
              prompt={i18n.t('dontHaveAccount')}
              action={i18n.t('createNewAccount')}
              onPress={() => router.push('/signup')}
            />
          </>
        ) : (
          <>
            <AuthTextField
              centered
              placeholder={i18n.t('enterCodeSent')}
              keyboardType="number-pad"
              value={code}
              onChangeText={setCode}
              maxLength={6}
              editable={!busy}
            />
            <PrimaryButton
              label={i18n.t('verifyAndSignIn')}
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

export default AuthSheet;
