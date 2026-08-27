import { describe, expect, it } from "vitest";
import { toggleSelection } from "../client/src/lib/betting";

describe("Nexus AI smart picks", () => {
  it("adds an AI pick once and removes it when toggled again", () => {
    const pick = { id: "live-match-۱", odds: 2.04 };
    const added = toggleSelection([], pick);
    expect(added).toEqual({ items: [pick], added: true });
    expect(toggleSelection(added.items, pick)).toEqual({ items: [], added: false });
  });
});
