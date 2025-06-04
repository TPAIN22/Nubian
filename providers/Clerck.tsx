import { ClerkProvider as ClerkProviderComponent, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/dist/token-cache";

function InnerProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded } = useAuth();

  if (!isLoaded) return null;

  return children;
}

export default function ClerkProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProviderComponent
      tokenCache={tokenCache}
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
    >
      <InnerProvider>{children}</InnerProvider>
    </ClerkProviderComponent>
  );
}
