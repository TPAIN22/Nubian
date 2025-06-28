import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useAuth, useClerk } from '@clerk/clerk-expo';
import { ActivityIndicator, View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

WebBrowser.maybeCompleteAuthSession();

export default function SSOCallback() {
  const { sessionId, isLoaded, isSignedIn } = useAuth();
  const { setActive } = useClerk();
  const router = useRouter();

  useEffect(() => {
    const finalizeSession = async () => {
      console.log('🔄 SSO Callback mounted');
      if (!isLoaded) return;

      console.log('isSignedIn:', isSignedIn);
      console.log('sessionId:', sessionId);

      if (isSignedIn && sessionId) {
        console.log('✅ Session active, redirecting...');
        router.replace('/');
        return;
      }

      const pending = await AsyncStorage.getItem('pendingSessionId');
      if (pending) {
        try {
          console.log('🛠 Trying to activate pending session:', pending);
          await setActive({ session: pending });
          await AsyncStorage.removeItem('pendingSessionId');
          router.replace('/');
        } catch (err) {
          console.log('❌ Failed to set active session:', err);
        }
      } else {
        console.log('⛔ No pending session found');
      }
    };

    finalizeSession();
  }, [isLoaded, sessionId, isSignedIn]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#A37E2C" />
      <Text style={{ marginTop: 12, color: '#666' }}>جارٍ تسجيل الدخول...</Text>
    </View>
  );
}
