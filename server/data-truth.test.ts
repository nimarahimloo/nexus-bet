import { describe, expect, it } from "vitest";
import { getDataSourceLabel, isOperationalDataSource } from "../shared/dataTruth";

describe("data truth labels", () => {
  it("distinguishes operational sources from preview and fallback", () => {
    expect(isOperationalDataSource("api")).toBe(true);
    expect(isOperationalDataSource("backend")).toBe(true);
    expect(isOperationalDataSource("demo")).toBe(false);
    expect(isOperationalDataSource("fallback")).toBe(false);
  });

  it("keeps user-facing source labels explicit", () => {
    expect(getDataSourceLabel("api")).toContain("واقعی");
    expect(getDataSourceLabel("backend")).toContain("واقعی");
    expect(getDataSourceLabel("demo")).toContain("پیش‌نمایش");
    expect(getDataSourceLabel("fallback")).toContain("fallback");
    expect(getDataSourceLabel("api", "provider unavailable")).toContain("خطا");
  });
});
