type Props = {
  loading?: boolean;
  loadingLabel?: string;
  children: React.ReactNode;
  className?: string;
  type?: 'submit' | 'button';
  disabled?: boolean;
  onClick?: () => void;
};

export default function AuthSubmitButton({
  loading = false,
  loadingLabel,
  children,
  className = '',
  type = 'submit',
  disabled,
  onClick,
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      className={`b365-btn-primary b365-btn-block b365-auth-submit ${className}`.trim()}
      disabled={isDisabled}
      onClick={onClick}
      aria-busy={loading}
    >
      {loading ? (
        <span className="b365-btn-loading">
          <span className="b365-spinner" aria-hidden="true" />
          <span>{loadingLabel ?? children}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
