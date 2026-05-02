import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useSSO } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/providers/ThemeProvider';
import i18n from '../../utils/i18n';
import { useTracking } from '@/hooks/useTracking';

WebBrowser.maybeCompleteAuthSession();

type Provider = 'google' | 'apple';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const colors = theme.colors;

  const { startSSOFlow } = useSSO();
  const { mergeSession } = useTracking();
  const [loading, setLoading] = useState<Provider | 'guest' | null>(null);

  const redirectUrl = AuthSession.makeRedirectUri({
    native: 'sdnubian://sso-callback',
  });

  const handleOAuth = useCallback(
    async (provider: Provider) => {
      try {
        setLoading(provider);
        const result = await startSSOFlow({
          strategy: `oauth_${provider}`,
          redirectUrl,
        });

        if (result.createdSessionId && result.setActive) {
          await result.setActive({ session: result.createdSessionId });
          await AsyncStorage.setItem('hasSeenOnboarding', 'true');
          await AsyncStorage.removeItem('isGuest');
          await mergeSession();
          router.replace('/(tabs)');
        }
      } catch (err: any) {
        if (err?.code !== 'oauth_access_denied') {
          Alert.alert(i18n.t('error'), i18n.t('failedToSignIn'));
        }
      } finally {
        setLoading(null);
      }
    },
    [startSSOFlow, redirectUrl, router, mergeSession]
  );

  const handleEmailSignIn = useCallback(() => {
    router.push('/(auth)/signin');
  }, [router]);

  const handleGuest = useCallback(async () => {
    try {
      setLoading('guest');
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      await AsyncStorage.setItem('isGuest', 'true');
      router.replace('/(tabs)');
    } finally {
      setLoading(null);
    }
  }, [router]);

  const isBusy = loading !== null;

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.surface,
          paddingTop: insets.top + 24,
          paddingBottom: Math.max(insets.bottom, 16) + 16,
        },
      ]}
    >
      <MotiView
        from={{ opacity: 0, translateY: -10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400 }}
        style={styles.header}
      >
        <Image
          source={require('../../assets/images/nubianLogo.png')}
          style={styles.logo}
          contentFit="contain"
        />
        <Text style={[styles.title, { color: colors.text.gray }]}>
          {i18n.t('welcome_title') || 'Welcome to Nubian'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.text.veryLightGray }]}>
          {i18n.t('welcome_subtitle') ||
            'Sign in to sync your cart and orders, or keep browsing as a guest.'}
        </Text>
      </MotiView>

      <MotiView
        from={{ opacity: 0, translateY: 12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 500, delay: 120 }}
        style={styles.actions}
      >
        <ProviderButton
          onPress={() => handleOAuth('google')}
          disabled={isBusy}
          loading={loading === 'google'}
          icon={
            <Image
              source={require('../../assets/images/google.svg')}
              style={styles.providerIcon}
              contentFit="contain"
            />
          }
          label={i18n.t('continueWithGoogle') || 'Continue with Google'}
          background={colors.cardBackground}
          borderColor={colors.borderLight}
          textColor="#1F1F1F"
        />

        {Platform.OS === 'ios' && (
          <ProviderButton
            onPress={() => handleOAuth('apple')}
            disabled={isBusy}
            loading={loading === 'apple'}
            icon={<Feather name="smartphone" size={20} color="#FFFFFF" />}
            label={i18n.t('continueWithApple') || 'Continue with Apple'}
            background="#000000"
            borderColor="#000000"
            textColor="#FFFFFF"
          />
        )}

        <ProviderButton
          onPress={handleEmailSignIn}
          disabled={isBusy}
          loading={false}
          icon={<Feather name="mail" size={20} color={colors.text.gray} />}
          label={i18n.t('signInWithEmail') || 'Sign in with email'}
          background={colors.cardBackground}
          borderColor={colors.borderLight}
          textColor={colors.text.gray}
        />

        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: colors.borderLight }]} />
          <Text style={[styles.dividerText, { color: colors.text.veryLightGray }]}>
            {i18n.t('or') || 'or'}
          </Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.borderLight }]} />
        </View>

        <TouchableOpacity
          onPress={handleGuest}
          disabled={isBusy}
          activeOpacity={0.7}
          style={styles.guestBtn}
          accessibilityRole="button"
          accessibilityLabel={i18n.t('continueAsGuest') || 'Continue as Guest'}
        >
          {loading === 'guest' ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={[styles.guestText, { color: colors.primary }]}>
              {i18n.t('continueAsGuest') || 'Continue as Guest'}
            </Text>
          )}
        </TouchableOpacity>
      </MotiView>

      <Text style={[styles.terms, { color: colors.text.veryLightGray }]}>
        {i18n.t('bySigningUpAgree') || 'By continuing, you agree to our'}{' '}
        <Text
          style={[styles.termsLink, { color: colors.primary }]}
          onPress={() => Linking.openURL('https://nubian-sd.store/terms-and-conditions')}
        >
          {i18n.t('termsAndConditions') || 'Terms'}
        </Text>{' '}
        {i18n.t('and') || 'and'}{' '}
        <Text
          style={[styles.termsLink, { color: colors.primary }]}
          onPress={() => Linking.openURL('https://nubian-sd.store/privacy-policy')}
        >
          {i18n.t('privacyPolicy') || 'Privacy Policy'}
        </Text>
        .
      </Text>
    </View>
  );
}

function ProviderButton({
  onPress,
  disabled,
  loading,
  icon,
  label,
  background,
  borderColor,
  textColor,
}: {
  onPress: () => void;
  disabled: boolean;
  loading: boolean;
  icon: React.ReactNode;
  label: string;
  background: string;
  borderColor: string;
  textColor: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      style={[
        styles.providerBtn,
        { backgroundColor: background, borderColor },
        disabled && !loading ? { opacity: 0.6 } : null,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          <View style={styles.providerIconWrap}>{icon}</View>
          <Text style={[styles.providerLabel, { color: textColor }]}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
  },
  logo: {
    width: 72,
    height: 72,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  actions: {
    gap: 12,
  },
  providerBtn: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },
  providerIconWrap: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerIcon: {
    width: 22,
    height: 22,
  },
  providerLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 13,
  },
  guestBtn: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  terms: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  termsLink: {
    fontSize: 12,
    fontWeight: '500',
  },
});
