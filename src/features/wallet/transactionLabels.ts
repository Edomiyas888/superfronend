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
    case 'free_bet_refund':
      return '↩';
    case 'free_bet_grant':
    case 'free_bet_stake':
    case 'free_bet_expire':
      return '🎁';
    default:
      return '•';
  }
}
