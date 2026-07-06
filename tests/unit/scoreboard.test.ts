import { describe, expect, it } from "vitest";
import { buildScoreboardModel, getScoreboardColumns } from "@/lib/domain/scoreboard";

describe("scoreboard model", () => {
  it("ranks ACM rows by solved count then penalty", () => {
    const model = buildScoreboardModel({
      type: "acm",
      rows: [
        { id: "a", handle: "alpha", solved: 2, penalty: 180, problems: [] },
        { id: "b", handle: "beta", solved: 2, penalty: 120, problems: [] },
      ],
    });

    expect(model.rows.map((row) => row.handle)).toEqual(["beta", "alpha"]);
  });

  it("ranks OI rows by score then latest improvement", () => {
    const model = buildScoreboardModel({
      type: "oi",
      rows: [
        { id: "a", handle: "alpha", score: 240, lastImprovedAt: "2026-07-07T10:03:00Z", problems: [] },
        { id: "b", handle: "beta", score: 260, lastImprovedAt: "2026-07-07T10:01:00Z", problems: [] },
      ],
    });

    expect(model.rows[0]?.handle).toBe("beta");
  });

  it("keeps tied rows on the same rank", () => {
    const model = buildScoreboardModel({
      type: "acm",
      rows: [
        { id: "a", handle: "alpha", solved: 3, penalty: 210, problems: [] },
        { id: "b", handle: "beta", solved: 3, penalty: 210, problems: [] },
        { id: "c", handle: "cyra", solved: 2, penalty: 120, problems: [] },
      ],
    });

    expect(model.rows.map((row) => row.rank)).toEqual([1, 1, 3]);
  });

  it("exposes contest type specific columns", () => {
    expect(getScoreboardColumns("acm")).toContain("Penalty");
    expect(getScoreboardColumns("oi")).toContain("Score");
  });
});
