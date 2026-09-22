import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { I18nProvider } from "@/components/providers/i18n-provider";
import { PlaygroundClient } from "@/features/playground/playground-client";
import { playgroundDraftKey } from "@/features/playground/draft-store";
import { createMockSession, saveSession } from "@/lib/auth/session";
import { mockLanguages, mockUser } from "@/lib/mock/fixtures";

const runsCreate = vi.fn();
const runsGet = vi.fn();
const languagesList = vi.fn();

const previousApiMode = process.env.NEXT_PUBLIC_SOJ_API_MODE;

vi.mock("@uiw/react-codemirror", () => ({
  default: (props: { value: string; onChange: (value: string) => void; "aria-label"?: string }) => (
    <textarea
      aria-label={props["aria-label"]}
      value={props.value}
      onChange={(event) => props.onChange(event.target.value)}
    />
  ),
}));

// 同 CodeMirror 的处理：Radix Select 在 jsdom 里靠 pointer 事件展开，
// 这里换成等价的原生 select，但保留 value / onValueChange 契约。
vi.mock("@/components/ui/select", () => ({
  Select: ({
    value,
    onValueChange,
    disabled,
    children,
  }: {
    value: string;
    onValueChange: (value: string) => void;
    disabled?: boolean;
    children: ReactNode;
  }) => (
    <select
      aria-label="Language"
      value={value}
      disabled={disabled}
      onChange={(event) => onValueChange(event.target.value)}
    >
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: ReactNode }) => <option value={value}>{children}</option>,
}));

vi.mock("@/lib/api/client", () => ({
  createBrowserApiClient: () => ({
    runs: { create: runsCreate, get: runsGet },
    languages: { list: languagesList },
  }),
}));

function renderWithLocale(ui: ReactNode) {
  return render(<I18nProvider locale="en">{ui}</I18nProvider>);
}

function seedDraft(languageId: number, sourceCode: string, stdin = "") {
  window.localStorage.setItem(
    playgroundDraftKey,
    JSON.stringify({ version: 1, drafts: { [String(languageId)]: { sourceCode, stdin } } }),
  );
}

describe("playground client", () => {
  beforeEach(() => {
    languagesList.mockResolvedValue({ items: mockLanguages, total: mockLanguages.length });
    runsCreate.mockResolvedValue({ id: 9, languageId: mockLanguages[0]?.id, status: "accepted", stdout: "ok\n", createdAt: new Date().toISOString() });
  });

  afterEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    process.env.NEXT_PUBLIC_SOJ_API_MODE = previousApiMode;
  });

  it("shows the editor to a visitor who is not signed in", async () => {
    process.env.NEXT_PUBLIC_SOJ_API_MODE = "http";

    renderWithLocale(<PlaygroundClient />);

    // 练习场是「入口」不是「内容详情」：匿名可以打开、可以写代码。
    await waitFor(() => expect(screen.getByLabelText("Source code")).toBeVisible());
    expect(screen.getByRole("button", { name: "Sign in to run" })).toBeDisabled();
  });

  it("does not post a run when there is no session", async () => {
    process.env.NEXT_PUBLIC_SOJ_API_MODE = "http";

    renderWithLocale(<PlaygroundClient />);
    await waitFor(() => expect(screen.getByLabelText("Source code")).toBeVisible());
    fireEvent.change(screen.getByLabelText("Source code"), { target: { value: "package main" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in to run" }));

    expect(runsCreate).not.toHaveBeenCalled();
  });

  it("runs without a problem id once signed in", async () => {
    process.env.NEXT_PUBLIC_SOJ_API_MODE = "http";
    saveSession(window.localStorage, createMockSession(mockUser));

    renderWithLocale(<PlaygroundClient />);
    await waitFor(() => expect(screen.getByLabelText("Source code")).toBeVisible());
    fireEvent.change(screen.getByLabelText("Source code"), { target: { value: "package main" } });
    fireEvent.change(screen.getByLabelText("Custom input"), { target: { value: "7\n" } });
    fireEvent.click(screen.getByRole("button", { name: "Run" }));

    await waitFor(() => {
      expect(runsCreate).toHaveBeenCalledWith({
        languageId: mockLanguages[0]?.id,
        sourceCode: "package main",
        stdin: "7\n",
      });
    });
    // 请求对象里不该出现 problemId 这个键，服务端才走自由运行。
    expect(runsCreate.mock.calls[0]?.[0]).not.toHaveProperty("problemId");
  });

  it("restores a saved draft for the first language instead of the starter template", async () => {
    process.env.NEXT_PUBLIC_SOJ_API_MODE = "mock";
    const languageId = mockLanguages[0]?.id ?? 0;
    seedDraft(languageId, "// my saved draft", "saved input");

    renderWithLocale(<PlaygroundClient />);

    // 先挂载再恢复草稿的话，CodeWorkspace 的模板种入会把用户存的代码顶掉。
    await waitFor(() => expect(screen.getByLabelText("Source code")).toHaveValue("// my saved draft"));
    expect(screen.getByLabelText("Custom input")).toHaveValue("saved input");
  });

  it("keeps a draft per language when switching", async () => {
    process.env.NEXT_PUBLIC_SOJ_API_MODE = "mock";
    const [first, second] = mockLanguages;
    seedDraft(second?.id ?? 0, "// second language draft");

    renderWithLocale(<PlaygroundClient />);
    await waitFor(() => expect(screen.getByLabelText("Source code")).toBeVisible());

    fireEvent.change(screen.getByLabelText("Source code"), { target: { value: "// first language edit" } });
    // 种模板的 effect 属于更早那次提交。它若拿旧值回写，这里就会看到模板——
    // 用户的编辑凭空消失，下面存的草稿自然也是模板。先钉住这一刻。
    expect(screen.getByLabelText("Source code")).toHaveValue("// first language edit");
    fireEvent.change(screen.getByLabelText("Language"), { target: { value: String(second?.id) } });

    await waitFor(() => expect(screen.getByLabelText("Source code")).toHaveValue("// second language draft"));

    const stored = JSON.parse(window.localStorage.getItem(playgroundDraftKey) ?? "{}");
    expect(stored.drafts[String(first?.id)]).toEqual({ sourceCode: "// first language edit", stdin: "" });
  });
});
