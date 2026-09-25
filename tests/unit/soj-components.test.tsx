import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { I18nProvider } from "@/components/providers/i18n-provider";
import { CodeWorkspace, isPristineSource } from "@/components/soj/code-workspace";
import { ScoreboardGrid } from "@/components/soj/scoreboard-grid";
import { SubmissionTimeline } from "@/components/soj/submission-timeline";
import { VerdictBadge } from "@/components/soj/verdict-badge";
import { ContestRegistration } from "@/features/contests/detail/contest-registration";
import { ContestWorkspacePage } from "@/features/contests/workspace/contest-workspace-page";
import { ProblemSubmitPanel } from "@/features/problems/problem-submit-panel";
import { createMockSession, saveSession } from "@/lib/auth/session";
import { markContestRegistered } from "@/lib/domain/contest-registration-session";
import { buildContest, buildProblem } from "@/lib/mock/builders";
import { mockLanguages, mockUser } from "@/lib/mock/fixtures";

const submissionsCreate = vi.fn();
const contestsRegister = vi.fn();
const previousApiMode = process.env.NEXT_PUBLIC_SOJ_API_MODE;

// jsdom 里跑不了真正的 CodeMirror：换成等价的 textarea，
// 但保留 value/onChange 契约，编辑行为依然被测到。
vi.mock("@uiw/react-codemirror", () => ({
  default: (props: { value: string; onChange: (value: string) => void; "aria-label"?: string }) => (
    <textarea
      aria-label={props["aria-label"]}
      value={props.value}
      onChange={(event) => props.onChange(event.target.value)}
      readOnly={false}
    />
  ),
}));

function renderWithLocale(ui: ReactNode) {
  return render(<I18nProvider locale="en">{ui}</I18nProvider>);
}

vi.mock("@/lib/api/client", () => ({
  createBrowserApiClient: () => ({
    contests: {
      register: contestsRegister,
    },
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
    renderWithLocale(<VerdictBadge status="accepted" />);
    expect(screen.getByText("Accepted")).toBeVisible();
  });

  it("renders ordered submission lifecycle events", () => {
    renderWithLocale(
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
    const { rerender } = renderWithLocale(<ScoreboardGrid mode="acm" rows={[{ id: "1", rank: 1, handle: "lin", solved: 4, penalty: 312 }]} />);
    expect(screen.getByText("Solved")).toBeVisible();

    rerender(<I18nProvider locale="en"><ScoreboardGrid mode="oi" rows={[{ id: "1", rank: 1, handle: "lin", score: 460, movement: 2 }]} /></I18nProvider>);
    expect(screen.getByText("Score")).toBeVisible();
  });

  it("edits source and reports the workspace state upward", () => {
    const handleChange = vi.fn();
    renderWithLocale(
      <CodeWorkspace
        languages={mockLanguages}
        value={{ languageId: mockLanguages[0]?.id, sourceCode: "custom source", stdin: "" }}
        onChange={handleChange}
      />,
    );

    expect(screen.getByLabelText("Source code")).toHaveValue("custom source");
    fireEvent.change(screen.getByLabelText("Source code"), { target: { value: "next source" } });

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({ sourceCode: "next source", languageId: mockLanguages[0]?.id }),
    );
  });

  it("does not seed the starter over a keystroke it has not seen yet", () => {
    // 语言目录还没到、模板还没种入时用户就先敲了字。种模板的 effect 属于更早那次
    // 提交，它闭包里的 sourceCode 还是空串——若拿这份落后的值做判断，会认定「源码
    // 就是空模板」并把用户刚敲的字覆盖掉。
    const handleChange = vi.fn();
    const { rerender } = renderWithLocale(
      <CodeWorkspace
        languages={[]}
        value={{ languageId: undefined, sourceCode: "", stdin: "" }}
        onChange={handleChange}
      />,
    );

    fireEvent.change(screen.getByLabelText("Source code"), { target: { value: "// typed before the catalog arrived" } });

    rerender(
      <I18nProvider locale="en">
        <CodeWorkspace
          languages={mockLanguages}
          value={{ languageId: mockLanguages[0]?.id, sourceCode: "", stdin: "" }}
          onChange={handleChange}
        />
      </I18nProvider>,
    );

    expect(handleChange).not.toHaveBeenCalledWith(expect.objectContaining({ sourceCode: expect.stringContaining("#include") }));
  });

  it("treats any language's unmodified starter as pristine and user code as not", () => {
    const cpp = "#include <bits/stdc++.h>";
    const python = "print()";
    const starters = new Set([cpp, python]);
    // 从未种入的初始空态：该种。
    expect(isPristineSource("", starters, false)).toBe(true);
    // 用户一个字没写就换了语言，编辑器里是上一门语言的模板：该换新模板。
    expect(isPristineSource(cpp, starters, true)).toBe(true);
    // 练习场刷新后源码来自草稿，草稿正是当初的模板：同样算没写，该换。
    expect(isPristineSource(python, starters, true)).toBe(true);
    // 用户写过的代码：换语言也不动。
    expect(isPristineSource("int main() { return 1; }", starters, true)).toBe(false);
    // 用户亲手清空的空串：尊重清空，不强行回填。
    expect(isPristineSource("", starters, true)).toBe(false);
  });

  it("disables HTTP submit without a browser session and posts edited source with one", async () => {
    process.env.NEXT_PUBLIC_SOJ_API_MODE = "http";
    submissionsCreate.mockResolvedValue({ id: 321 });
    const problem = buildProblem({ id: 44 });
    const { unmount } = renderWithLocale(<ProblemSubmitPanel problem={problem} languages={mockLanguages} />);

    expect(screen.getByRole("button", { name: "Sign in to submit" })).toBeDisabled();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/en/auth/login");

    saveSession(window.localStorage, createMockSession(mockUser));
    unmount();
    renderWithLocale(<ProblemSubmitPanel problem={problem} languages={mockLanguages} />);

    fireEvent.change(screen.getByLabelText("Source code"), { target: { value: "edited source" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

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
    renderWithLocale(<ContestWorkspacePage contest={{ ...buildContest({ id: 88 }), phase: "live", canSubmit: true }} problem={buildProblem({ id: 1 })} languages={mockLanguages} />);

    expect(screen.getByRole("button", { name: "Sign in to submit" })).toBeDisabled();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/en/auth/login");
  });

  it("prompts sign-in instead of posting contest registration without a browser session", () => {
    process.env.NEXT_PUBLIC_SOJ_API_MODE = "http";
    renderWithLocale(
      <ContestRegistration
        contest={{
          ...buildContest({ id: 88, status: "scheduled", registered: false }),
          canRegister: true,
          canSubmit: false,
        }}
      />,
    );

    expect(screen.getByRole("button", { name: "Sign in to register" })).toBeDisabled();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/en/auth/login");
    expect(contestsRegister).not.toHaveBeenCalled();
  });

  it("posts contest registration with saved session and shows enter contest", async () => {
    process.env.NEXT_PUBLIC_SOJ_API_MODE = "http";
    contestsRegister.mockResolvedValue({ id: 9 });
    saveSession(window.localStorage, createMockSession(mockUser));
    renderWithLocale(
      <ContestRegistration
        contest={{
          ...buildContest({ id: 88, status: "scheduled", registered: false }),
          canRegister: true,
          canSubmit: false,
        }}
      />,
    );

    fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "  Lin  " } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "  lin@example.com  " } });
    fireEvent.change(screen.getByLabelText("Invite code"), { target: { value: "INVITE-7" } });
    fireEvent.click(screen.getByRole("button", { name: "Register" }));

    await waitFor(() => {
      expect(contestsRegister).toHaveBeenCalledWith(88, {
        displayName: "Lin",
        email: "lin@example.com",
        inviteCode: "INVITE-7",
      });
    });
    expect(await screen.findByRole("link", { name: "Enter contest" })).toHaveAttribute("href", "/en/contests/88/problems/1");
  });

  it("posts edited contest source with contest context when signed in", async () => {
    process.env.NEXT_PUBLIC_SOJ_API_MODE = "http";
    submissionsCreate.mockResolvedValue({ id: 654 });
    saveSession(window.localStorage, createMockSession(mockUser));
    const contest = buildContest({ id: 88 });
    const problem = buildProblem({ id: 1 });
    renderWithLocale(<ContestWorkspacePage contest={{ ...contest, phase: "live", canSubmit: true }} problem={problem} languages={mockLanguages} />);

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

  it("does not unlock HTTP contest workspace from local registration state", async () => {
    process.env.NEXT_PUBLIC_SOJ_API_MODE = "http";
    saveSession(window.localStorage, createMockSession(mockUser));
    markContestRegistered(window.localStorage, mockUser.id, 88);
    const contest = buildContest({ id: 88, registered: false, status: "running" });
    const problem = buildProblem({ id: 1 });
    renderWithLocale(<ContestWorkspacePage contest={{ ...contest, phase: "live", canSubmit: false }} problem={problem} languages={mockLanguages} />);

    fireEvent.change(screen.getByLabelText("Source code"), { target: { value: "contest local registration source" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit solution" }));

    expect(screen.getByRole("button", { name: "Submit solution" })).toBeDisabled();
    expect(submissionsCreate).not.toHaveBeenCalled();
  });

  it("does not unlock contest workspace from another user's local registration", () => {
    process.env.NEXT_PUBLIC_SOJ_API_MODE = "http";
    saveSession(window.localStorage, createMockSession({ ...mockUser, id: 7, handle: "lin-chen" }));
    markContestRegistered(window.localStorage, 7, 88);
    saveSession(window.localStorage, createMockSession({ ...mockUser, id: 8, handle: "mira" }));

    const contest = buildContest({ id: 88, registered: false, status: "running" });
    renderWithLocale(<ContestWorkspacePage contest={{ ...contest, phase: "live", canSubmit: false }} problem={buildProblem({ id: 1 })} languages={mockLanguages} />);

    fireEvent.change(screen.getByLabelText("Source code"), { target: { value: "other user source" } });

    expect(screen.getByRole("button", { name: "Submit solution" })).toBeDisabled();
    expect(submissionsCreate).not.toHaveBeenCalled();
  });
});
