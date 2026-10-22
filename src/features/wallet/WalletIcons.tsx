import type { ReactNode } from 'react';
import type { WalletTxType } from './transactionLabels';

function Icon({ size = 18, children }: { size?: number; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export const DepositIcon = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <path d="M12 4v12M6 10l6 6 6-6M5 20h14" />
  </Icon>
);

export const WithdrawIcon = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <path d="M12 20V8M6 14l6-6 6 6M5 4h14" />
  </Icon>
);

export const HistoryIcon = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5M12 7v5l3 2" />
  </Icon>
);

export const RefreshIcon = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <path d="M20 11a8 8 0 0 0-14.5-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.5 4.5L20 16M20 20v-4h-4" />
  </Icon>
);

export const CopyIcon = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V6a2 2 0 0 1 2-2h8" />
  </Icon>
);

export const CheckIcon = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <path d="M5 12.5 10 17l9-10" />
  </Icon>
);

export const InfoIcon = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </Icon>
);

export const LockIcon = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </Icon>
);

export const UploadIcon = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <path d="M12 15V4M7 9l5-5 5 5M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
  </Icon>
);

export const GiftIcon = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <rect x="3" y="8" width="18" height="4" rx="1" />
    <path d="M5 12v8h14v-8M12 8v12M12 8c-1.5-3-5-4-5-1.5S10 8 12 8zM12 8c1.5-3 5-4 5-1.5S14 8 12 8z" />
  </Icon>
);

const TicketIcon = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z" />
    <path d="M14 5v12" strokeDasharray="2 2" />
  </Icon>
);

const TrophyIcon = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8M10 17h4" />
  </Icon>
);

const UndoIcon = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
  </Icon>
);

const ClockIcon = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Icon>
);

/** Icon for a ledger row, keyed by transaction type. */
export function TxIcon({ type, size = 18 }: { type: WalletTxType; size?: number }) {
  switch (type) {
    case 'deposit':
      return <DepositIcon size={size} />;
    case 'withdraw':
      return <WithdrawIcon size={size} />;
    case 'bet_stake':
      return <TicketIcon size={size} />;
    case 'bet_win':
      return <TrophyIcon size={size} />;
    case 'bet_void':
    case 'free_bet_refund':
      return <UndoIcon size={size} />;
    case 'free_bet_expire':
      return <ClockIcon size={size} />;
    case 'free_bet_grant':
    case 'free_bet_stake':
      return <GiftIcon size={size} />;
    default:
      return <InfoIcon size={size} />;
  }
}
