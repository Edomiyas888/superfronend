type Props = {
  variant: 'error' | 'success';
  children: React.ReactNode;
};

export default function AuthAlert({ variant, children }: Props) {
  if (!children) return null;
  return (
    <div className={`b365-auth-alert b365-auth-alert--${variant}`} role={variant === 'error' ? 'alert' : 'status'}>
      <span className="b365-auth-alert-icon" aria-hidden="true">
        {variant === 'error' ? '!' : '✓'}
      </span>
      <span>{children}</span>
    </div>
  );
}
