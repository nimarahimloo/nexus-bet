import { describe, expect, it } from "vitest";
import { mapSportsDetails } from "../shared/sports";
import { closeMatchModal, closesMatchModal, getMatchDetailsStatus, getTabEmptyMessage, matchModalTabs, openMatchModal, shouldCloseFromBackdrop } from "../shared/matchModal";

describe("sports match details", () => {
  it("maps statistics, lineups and events from API-shaped payloads", () => {
    const detail = mapSportsDetails("42", {
      statistics: { statistics: [{ team: { name: "میزبان" }, statistics: [{ type: "مالکیت", value: "۵۵%" }] }] },
      lineups: { lineups: [{ team: { name: "میزبان" }, formation: "۴-۳-۳", startXI: [{ player: { name: "دروازه‌بان", number: 1, pos: "GK" } }] }] },
      events: { events: [{ time: { elapsed: 67 }, team: { name: "مهمان" }, player: { name: "مهاجم" }, type: "Goal", detail: "Normal Goal" }] },
    });
    expect(detail.fixtureId).toBe("42");
    expect(detail.statistics[0]).toEqual({ label: "مالکیت", home: "میزبان", away: "۵۵%" });
    expect(detail.lineups[0]?.players[0]).toEqual({ name: "دروازه‌بان", position: "GK", number: 1 });
    expect(detail.events[0]?.minute).toBe("۶۷′");
  });

  it("exposes deterministic modal interaction and loading/error states", () => {
    expect(matchModalTabs).toEqual(["stats", "lineups", "events"]);
    expect(openMatchModal("42", true)).toEqual({ selectedId: "42", isApi: true });
    expect(closeMatchModal()).toBeNull();
    expect(shouldCloseFromBackdrop("backdrop", "backdrop")).toBe(true);
    expect(shouldCloseFromBackdrop("modal", "backdrop")).toBe(false);
    expect(closesMatchModal("Escape")).toBe(true);
    expect(closesMatchModal("Enter")).toBe(false);
    expect(getMatchDetailsStatus({ loading: true, hasContent: false })).toBe("loading");
    expect(getMatchDetailsStatus({ loading: false, error: "خطا", hasContent: false })).toBe("error");
    expect(getMatchDetailsStatus({ loading: false, hasContent: false, isDemo: true })).toBe("demo");
    expect(getMatchDetailsStatus({ loading: false, hasContent: false })).toBe("empty");
    expect(getTabEmptyMessage("stats")).toContain("آمار");
    expect(getTabEmptyMessage("lineups")).toContain("ترکیب");
    expect(getTabEmptyMessage("events")).toContain("رویداد");
  });

});
