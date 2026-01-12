import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useAuth, useClerk } from '@clerk/clerk-expo';
import { ActivityIndicator, View } from 'react-native';
import { Text } from '@/components/ui/text';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useTracking from '@/hooks/useTracking';

WebBrowser.maybeCompleteAuthSession();

export default function SSOCallback() {
  const { sessionId, isLoaded, isSignedIn, userId } = useAuth();
  const { setActive } = useClerk();
  const router = useRouter();
  const { mergeSession } = useTracking();

  useEffect(() => {
    const finalizeSession = async () => {
      
      if (!isLoaded) return;
      if (isSignedIn && sessionId && userId) {
        // Merge guest session with user account
        await mergeSession();
        router.replace('/');
        return;
      }

      const pending = await AsyncStorage.getItem('pendingSessionId');
      if (pending) {
        try {
          
          await setActive({ session: pending });
          await AsyncStorage.removeItem('pendingSessionId');
          // Merge guest session with user account
          if (userId) {
            await mergeSession();
          }
          router.replace('/');
        } catch (err) {
          
        }
      } else {
        
      }
    };

    finalizeSession();
  }, [isLoaded, sessionId, isSignedIn, userId, mergeSession]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#A37E2C" />
      <Text style={{ marginTop: 12, color: '#666' }}>جارٍ تسجيل الدخول...</Text>
    </View>
  );
}
