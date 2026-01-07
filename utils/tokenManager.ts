/**
 * Token Manager for Clerk Authentication
 * 
 * This utility manages Clerk tokens for API requests.
 * Components can set a token getter function that axios will use.
 */

type TokenGetter = () => Promise<string | null>;

let tokenGetter: TokenGetter | null = null;

/**
 * Set the token getter function
 * This should be called from a component that has access to useAuth()
 */
export const setTokenGetter = (getter: TokenGetter) => {
  tokenGetter = getter;
};

/**
 * Clear the token getter
 */
export const clearTokenGetter = () => {
  tokenGetter = null;
};

/**
 * Get the current token
 * This is used by axios interceptors
 */
export const getToken = async (): Promise<string | null> => {
  if (!tokenGetter) {
    return null;
  }
  try {
    return await tokenGetter();
  } catch (error) {
    console.warn('Failed to get token:', error);
    return null;
  }
};

/**
 * Check if token getter is available
 */
export const hasTokenGetter = (): boolean => {
  return tokenGetter !== null;
};

