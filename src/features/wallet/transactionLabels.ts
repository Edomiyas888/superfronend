export type WalletTxType =
  | 'deposit'
  | 'withdraw'
  | 'bet_stake'
  | 'bet_win'
  | 'bet_void'
  | string;

export type WalletHistoryFilter = 'all' | 'deposit' | 'withdraw' | 'bets';

const LABELS: Record<string, string> = {
  deposit: 'Deposit',
  withdraw: 'Withdrawal',
  bet_stake: 'Bet placed',
  bet_win: 'Bet won',
  bet_void: 'Bet void refund',
};

export function txTypeLabel(type: WalletTxType): string {
  return LABELS[type] ?? type.replace(/_/g, ' ');
}

export function txIsCredit(type: WalletTxType): boolean {
  return type === 'deposit' || type === 'bet_win' || type === 'bet_void';
}

export function txIcon(type: WalletTxType): string {
  switch (type) {
    case 'deposit':
      return '↓';
    case 'withdraw':
      return '↑';
    case 'bet_stake':
      return '◆';
    case 'bet_win':
      return '★';
    case 'bet_void':
      return '↩';
    default:
      return '•';
  }
}
