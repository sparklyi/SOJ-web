import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ScoreboardGrid } from "@/components/soj/scoreboard-grid";
import { SubmissionTimeline } from "@/components/soj/submission-timeline";
import { VerdictBadge } from "@/components/soj/verdict-badge";

describe("soj product components", () => {
  it("renders verdict states", () => {
    render(<VerdictBadge status="accepted" />);
    expect(screen.getByText("Accepted")).toBeVisible();
  });

  it("renders ordered submission lifecycle events", () => {
    render(
      <SubmissionTimeline
        items={[
          { id: "1", status: "queued", label: "Queued" },
          { id: "2", status: "running", label: "Running tests" },
          { id: "3", status: "accepted", label: "Accepted" },
        ]}
      />,
    );
    expect(screen.getByText("Running tests")).toBeVisible();
  });

  it("renders ACM and OI scoreboard rows", () => {
    const { rerender } = render(<ScoreboardGrid mode="acm" rows={[{ id: "1", rank: 1, handle: "lin", solved: 4, penalty: 312 }]} />);
    expect(screen.getByText("Solved")).toBeVisible();

    rerender(<ScoreboardGrid mode="oi" rows={[{ id: "1", rank: 1, handle: "lin", score: 460, movement: 2 }]} />);
    expect(screen.getByText("Score")).toBeVisible();
  });
});
