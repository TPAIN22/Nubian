/**
 * Token Manager for Clerk Authentication
 * 
 * This utility manages Clerk tokens for API requests.
 * Components can set a token getter function that axios will use.
 */

type TokenGetter = () => Promise<string | null>;

/**
 * Whether Clerk has finished loading, and whether it reports a live session.
 * The axios interceptor uses this to decide how long it may wait for a token:
 * a guest request must not be held up, but a request made *while signed in*
 * has to carry `Authorization` or the backend answers 401 and the caller
 * mistakes it for "no data".
 */
interface AuthSnapshot {
  isLoaded: boolean;
  isSignedIn: boolean;
}

let tokenGetter: TokenGetter | null = null;
let authSnapshot: AuthSnapshot = { isLoaded: false, isSignedIn: false };

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
  authSnapshot = { isLoaded: false, isSignedIn: false };
};

/** Publish Clerk's load/session state for the interceptor to read. */
export const setAuthSnapshot = (snapshot: AuthSnapshot) => {
  authSnapshot = snapshot;
};

export const getAuthSnapshot = (): AuthSnapshot => authSnapshot;

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

