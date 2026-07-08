import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CodeWorkspace } from "@/components/soj/code-workspace";
import { ScoreboardGrid } from "@/components/soj/scoreboard-grid";
import { SubmissionTimeline } from "@/components/soj/submission-timeline";
import { VerdictBadge } from "@/components/soj/verdict-badge";
import { ContestWorkspacePage } from "@/features/contests/workspace/contest-workspace-page";
import { ProblemSubmitPanel } from "@/features/problems/problem-submit-panel";
import { createMockSession, saveSession } from "@/lib/auth/session";
import { buildContest, buildProblem } from "@/lib/mock/builders";
import { mockLanguages, mockUser } from "@/lib/mock/fixtures";

const submissionsCreate = vi.fn();
const previousApiMode = process.env.NEXT_PUBLIC_SOJ_API_MODE;

vi.mock("@/lib/api/client", () => ({
  createBrowserApiClient: () => ({
    submissions: {
      create: submissionsCreate,
    },
  }),
}));

describe("soj product components", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    window.localStorage.clear();
    process.env.NEXT_PUBLIC_SOJ_API_MODE = previousApiMode;
  });

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

  it("keeps edited source when switching languages", () => {
    render(<CodeWorkspace languages={mockLanguages} />);

    const editor = screen.getByLabelText("Source code");
    fireEvent.change(editor, { target: { value: "custom source" } });
    fireEvent.change(screen.getByLabelText("Language"), { target: { value: String(mockLanguages[1]?.id) } });

    expect(screen.getByLabelText("Source code")).toHaveValue("custom source");
  });

  it("disables HTTP submit without a browser session and posts edited source with one", async () => {
    process.env.NEXT_PUBLIC_SOJ_API_MODE = "http";
    submissionsCreate.mockResolvedValue({ id: 321 });
    const problem = buildProblem({ id: 44 });
    const { unmount } = render(<ProblemSubmitPanel problem={problem} languages={mockLanguages} />);

    expect(screen.getByRole("button", { name: "Sign in to submit" })).toBeDisabled();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/auth/login");

    saveSession(window.localStorage, createMockSession(mockUser));
    unmount();
    render(<ProblemSubmitPanel problem={problem} languages={mockLanguages} />);

    fireEvent.change(screen.getByLabelText("Source code"), { target: { value: "edited source" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit solution" }));

    await waitFor(() => {
      expect(submissionsCreate).toHaveBeenCalledWith({
        problemId: 44,
        languageId: mockLanguages[0]?.id,
        sourceCode: "edited source",
      });
    });
  });

  it("disables HTTP contest submit without a browser session", () => {
    process.env.NEXT_PUBLIC_SOJ_API_MODE = "http";
    render(<ContestWorkspacePage contest={{ ...buildContest({ id: 88 }), phase: "live", canSubmit: true }} problem={buildProblem({ id: 1 })} languages={mockLanguages} />);

    expect(screen.getByRole("button", { name: "Sign in to submit" })).toBeDisabled();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/auth/login");
  });

  it("posts edited contest source with contest context when signed in", async () => {
    process.env.NEXT_PUBLIC_SOJ_API_MODE = "http";
    submissionsCreate.mockResolvedValue({ id: 654 });
    saveSession(window.localStorage, createMockSession(mockUser));
    const contest = buildContest({ id: 88 });
    const problem = buildProblem({ id: 1 });
    render(<ContestWorkspacePage contest={{ ...contest, phase: "live", canSubmit: true }} problem={problem} languages={mockLanguages} />);

    fireEvent.change(screen.getByLabelText("Source code"), { target: { value: "contest edited source" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit solution" }));

    await waitFor(() => {
      expect(submissionsCreate).toHaveBeenCalledWith({
        problemId: 1,
        contestId: 88,
        languageId: mockLanguages[0]?.id,
        sourceCode: "contest edited source",
      });
    });
  });
});
