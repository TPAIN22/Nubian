import { ClerkProvider as ClerkProviderComponent } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import type { PropsWithChildren } from "react";
import { useRouter } from "expo-router";

export default function ClerkProvider({ children }: PropsWithChildren) {
  const router = useRouter();
  return (
    <ClerkProviderComponent
      tokenCache={tokenCache}
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      routerPush={(to) => router.push(to as any)}
      routerReplace={(to) => router.replace(to as any)}
    >
      {children}
    </ClerkProviderComponent>
  );
}