/**
 * Placeholder for the new balance / wallet backend (not the legacy finixbet stack).
 * Replace `fetchBalance` with your API when ready.
 */

export type WalletInfo = {
  balance: number | null;
  currency: string;
  status: 'stub' | 'live';
};

export async function fetchBalance(): Promise<WalletInfo> {
  return Promise.resolve({
    balance: null,
    currency: 'ETB',
    status: 'stub',
  });
}
