export type BettingSelection = {
  odds: number;
};

export function combinedOdds(selections: BettingSelection[]): number {
  if (selections.length === 0) return 0;
  return Number(selections.reduce((total, selection) => total * selection.odds, 1).toFixed(2));
}

export function calculatePotentialReturn(stake: number, odds: number): number {
  if (!Number.isFinite(stake) || !Number.isFinite(odds) || stake <= 0 || odds <= 0) return 0;
  return Number((stake * odds).toFixed(2));
}

export function isValidUsdtStake(stake: number, availableBalance: number): boolean {
  return Number.isFinite(stake) && stake >= 1 && stake <= availableBalance;
}

export function toggleSelection<T extends { id: string }>(items: T[], selection: T): { items: T[]; added: boolean } {
  const exists = items.some((item) => item.id === selection.id);
  return {
    items: exists ? items.filter((item) => item.id !== selection.id) : [...items, selection],
    added: !exists,
  };
}
