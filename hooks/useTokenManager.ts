import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { setTokenGetter, clearTokenGetter } from '@/utils/tokenManager';

/**
 * Hook to initialize token manager with Clerk's getToken function
 * This should be used in the root layout or a high-level component
 */
export const useTokenManager = () => {
  const { getToken } = useAuth();

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
};

