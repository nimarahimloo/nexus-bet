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

export type WalletStakeState = "guest" | "loading" | "error" | "insufficient" | "invalid" | "ready";
export type TicketConfirmationState = WalletStakeState | "empty";

export function getTicketConfirmationState(input: {
  selectionCount: number;
  authenticated: boolean;
  loading: boolean;
  error: boolean;
  stake: number;
  availableBalance: number;
}): TicketConfirmationState {
  if (input.selectionCount < 1) return "empty";
  return validateStakeAgainstWallet(input).state;
}

export function validateStakeAgainstWallet(input: {
  authenticated: boolean;
  loading: boolean;
  error: boolean;
  stake: number;
  availableBalance: number;
}): { state: WalletStakeState; canPlace: boolean } {
  if (!input.authenticated) return { state: "guest", canPlace: false };
  if (input.loading) return { state: "loading", canPlace: false };
  if (input.error) return { state: "error", canPlace: false };
  if (!Number.isFinite(input.stake) || input.stake < 1) return { state: "invalid", canPlace: false };
  if (input.stake > input.availableBalance) return { state: "insufficient", canPlace: false };
  return { state: "ready", canPlace: true };
}
