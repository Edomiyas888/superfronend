/** Atlas money format: space thousands separator, two decimals only when there is a fraction. */
export function formatKenoMoney(value) {
  const amount = Math.abs(Number(value) || 0);
  const sign = Number(value) < 0 ? '-' : '';
  const hasFraction = Math.round(amount * 100) % 100 !== 0;
  const [whole, fraction] = amount.toFixed(hasFraction ? 2 : 0).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${sign}${grouped}${fraction ? `.${fraction}` : ''}`;
}
