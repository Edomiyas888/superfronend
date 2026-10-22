export type WalletTxType =
  | 'deposit'
  | 'withdraw'
  | 'bet_stake'
  | 'bet_win'
  | 'bet_void'
  | string;

export type WalletHistoryFilter = 'all' | 'deposit' | 'withdraw' | 'bets' | 'bet_win';

const LABELS: Record<string, string> = {
  deposit: 'Deposit',
  withdraw: 'Withdrawal',
  bet_stake: 'Bet placed',
  bet_win: 'Bet won',
  bet_void: 'Bet void refund',
  free_bet_grant: 'Free bet received',
  free_bet_stake: 'Free bet placed',
  free_bet_refund: 'Free bet returned',
  free_bet_expire: 'Free bet expired',
};

export function txTypeLabel(type: WalletTxType): string {
  return LABELS[type] ?? type.replace(/_/g, ' ');
}

export function txIsCredit(type: WalletTxType): boolean {
  return (
    type === 'deposit' ||
    type === 'bet_win' ||
    type === 'bet_void' ||
    type === 'free_bet_grant' ||
    type === 'free_bet_refund'
  );
}

/** `1290.5` → `1,290.50` */
export function formatMoney(value: number): string {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
