import { ClerkProvider as ClerkProviderComponent } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/dist/token-cache";

export default function ClerkProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProviderComponent
      tokenCache={tokenCache}
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
    >
      {children}
    </ClerkProviderComponent>
  );
}