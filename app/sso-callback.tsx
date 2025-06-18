import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useAuth, useClerk } from '@clerk/clerk-expo';
import { ActivityIndicator, View } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export default function SSOCallback() {
  const { sessionId, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return; 

    if (sessionId) {
      router.replace('/');
    } else {
      return
    }
  }, [isLoaded, sessionId]); 
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#A37E2C" />
    </View>
  );
}
