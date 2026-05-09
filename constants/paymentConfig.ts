/**
 * Payment configuration.
 *
 * Bank-transfer account details should ultimately come from a backend
 * settings endpoint (so finance can rotate them without an app release).
 * For now we centralize them here so the UI doesn't fish them out of
 * locale files, and we honor EXPO_PUBLIC_BANK_* overrides for staging.
 */

export type BankTransferConfig = {
  accountNumber: string;
  accountName: string;
  bankName: string;
};

const env = (process.env ?? {}) as Record<string, string | undefined>;

export const bankTransferConfig: BankTransferConfig = {
  accountNumber: env.EXPO_PUBLIC_BANK_ACCOUNT_NUMBER ?? "5831233",
  accountName: env.EXPO_PUBLIC_BANK_ACCOUNT_NAME ?? "Seyed Ahmed",
  bankName: env.EXPO_PUBLIC_BANK_NAME ?? "Bankak",
};

/** Orders above this threshold (in the user's currency) require bank transfer with a receipt. */
export const bankTransferProofThreshold = Number(
  env.EXPO_PUBLIC_BANK_PROOF_THRESHOLD ?? 25000
);
