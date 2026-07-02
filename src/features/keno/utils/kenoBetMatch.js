export function normalizeBetNumbers(numbers) {
  return [...(numbers ?? [])].map(Number).sort((a, b) => a - b);
}

export function kenoBetsMatch(a, b) {
  const numsA = normalizeBetNumbers(a?.selectedNumbers);
  const numsB = normalizeBetNumbers(b?.selectedNumbers);
  if (numsA.length !== numsB.length) return false;
  if (!numsA.every((n, i) => n === numsB[i])) return false;
  return Number(a?.betAmount) === Number(b?.betAmount);
}

export function filterUnconfirmedPendingBets(pendingBets, selfBets) {
  return (pendingBets ?? []).filter(
    (pending) => !(selfBets ?? []).some((confirmed) => kenoBetsMatch(pending, confirmed)),
  );
}
