export const matchModalTabs = ["stats", "lineups", "events"] as const;
export type MatchModalTab = (typeof matchModalTabs)[number];

export type MatchModalState = { selectedId: string; isApi: boolean } | null;

export function openMatchModal(selectedId: string, isApi: boolean): MatchModalState {
  return { selectedId, isApi };
}

export function closeMatchModal(): MatchModalState {
  return null;
}

export function shouldCloseFromBackdrop(target: EventTarget | null, currentTarget: EventTarget | null): boolean {
  return target === currentTarget;
}

export function closesMatchModal(key: string): boolean {
  return key === "Escape";
}

export function getTabEmptyMessage(tab: MatchModalTab): string {
  return tab === "stats" ? "آمار این مسابقه هنوز از سرویس دریافت نشده است." : tab === "lineups" ? "ترکیب رسمی هنوز اعلام یا دریافت نشده است." : "رویداد مهمی برای نمایش ثبت نشده است.";
}

export function getMatchDetailsStatus(input: { loading: boolean; error?: string | null; hasContent: boolean; isDemo?: boolean }): "loading" | "error" | "demo" | "empty" | "ready" {
  if (input.loading) return "loading";
  if (input.error) return "error";
  if (input.isDemo) return "demo";
  return input.hasContent ? "ready" : "empty";
}
