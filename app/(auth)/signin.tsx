// components/GoogleSignInSheet.tsx

import React, { useCallback, useEffect, useState } from 'react';
import { View, Alert, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useSSO } from '@clerk/clerk-expo';
import * as Linking from 'expo-linking';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import i18n from '../../utils/i18n';

WebBrowser.maybeCompleteAuthSession();

const GoogleSignInSheet = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { startSSOFlow } = useSSO();
  const redirectUrl = Linking.createURL('sso-callback');

  const handleSignIn = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl,
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        Alert.alert(i18n.t('alertSuccessTitle'), i18n.t('alertSuccessMessage'));
        router.replace('/');
      }
    } catch (err: any) {
      setError(err.message || i18n.t('signInError'));
      Alert.alert(i18n.t('alertErrorTitle'), i18n.t('alertErrorMessage'));
    } finally {
      setIsLoading(false);
    }
  }, [startSSOFlow, redirectUrl]);

  return (
    <View style={styles.container}>
      {error && <Text style={styles.errorText}>{error}</Text>}
      <Text style={styles.infoText}>
        {i18n.t('signInGooglePrompt')}
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
            <Image style={{ width: 20, height: 20, tintColor: '#fff' }} source={require("../../assets/images/google.svg")} />
            <Text style={styles.buttonText}>{i18n.t('continueWithGoogle')}</Text>
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
    backgroundColor: '#e98c22',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
    marginTop: 20,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
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
    fontSize: 18,
    textAlign: 'center',
    color: '#1b1b1ba3',
    marginVertical: 20,
    fontWeight: '600',
  },
});
