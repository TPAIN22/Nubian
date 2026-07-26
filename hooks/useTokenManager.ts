import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { setTokenGetter, clearTokenGetter, setAuthSnapshot } from '@/utils/tokenManager';

/**
 * Hook to initialize token manager with Clerk's getToken function
 * This should be used in the root layout or a high-level component
 */
export const useTokenManager = () => {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    // Set the token getter function
    setTokenGetter(async () => {
      try {
        return await getToken();
      } catch (error) {
        console.warn('Failed to get Clerk token:', error);
        return null;
      }
    });

    // Cleanup on unmount
    return () => {
      clearTokenGetter();
    };
  }, [getToken]);

  // Kept separate from the getter effect so a session change republishes the
  // snapshot without tearing down and rebuilding the getter. The interceptor
  // reads this to tell "guest, don't wait" apart from "signed in, the token is
  // mandatory" — see services/api/client.ts.
  useEffect(() => {
    setAuthSnapshot({ isLoaded: !!isLoaded, isSignedIn: !!isSignedIn });
  }, [isLoaded, isSignedIn]);
};
