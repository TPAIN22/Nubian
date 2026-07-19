// Shared completion logic for Clerk SSO (Google / Facebook / Apple) flows.
//
// `startSSOFlow` only returns a `createdSessionId` for existing users whose
// sign-in completes in one step. For NEW users, Clerk returns an incomplete
// `signUp` object instead — if we ignore it (as the old code did), the user
// authenticates in the browser, comes back to the app, and nothing happens.

interface SSOFlowResult {
  createdSessionId: string | null;
  setActive?: ((params: { session: string | null }) => Promise<unknown>) | null;
  signIn?: any;
  signUp?: any;
  authSessionResult?: { type: string } | null;
}

/**
 * Activates the session from an SSO flow result, completing the sign-up
 * for first-time users when possible.
 *
 * @returns true if a session was activated, false otherwise.
 */
export async function completeSSOFlow(result: SSOFlowResult): Promise<boolean> {
  const { createdSessionId, setActive, signUp } = result;

  // Existing user — session created directly.
  if (createdSessionId && setActive) {
    await setActive({ session: createdSessionId });
    return true;
  }

  // New user — OAuth succeeded but the sign-up wasn't auto-completed.
  // If the provider already supplied every required field, one update
  // call finishes it.
  if (
    signUp &&
    setActive &&
    signUp.status === 'missing_requirements' &&
    (signUp.missingFields?.length ?? 0) === 0
  ) {
    const completed = await signUp.update({});
    if (completed.status === 'complete' && completed.createdSessionId) {
      await setActive({ session: completed.createdSessionId });
      return true;
    }
  }

  if (__DEV__) {
    // Surface why the flow stalled instead of failing silently.
    console.error('[SSO] flow incomplete', {
      signUpStatus: signUp?.status,
      missingFields: signUp?.missingFields,
      signInStatus: result.signIn?.status,
      authSessionResult: result.authSessionResult?.type,
    });
  }

  return false;
}

/**
 * True when the browser auth session finished successfully — used to
 * distinguish a real failure (show an error) from the user cancelling
 * the browser (stay silent).
 */
export function ssoBrowserSucceeded(result: SSOFlowResult): boolean {
  return result.authSessionResult?.type === 'success';
}
