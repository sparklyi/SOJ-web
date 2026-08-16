import { render, screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/components/providers/app-providers";
import { PageShell } from "@/components/layout/page-shell";
import { SplitWorkspace } from "@/components/layout/split-workspace";
import { createMockSession, saveSession } from "@/lib/auth/session";
import { mockAuthorUser, mockUser } from "@/lib/mock/fixtures";

vi.mock("next/navigation", () => ({
  usePathname: () => "/en",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn() }),
}));

describe("app shell", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("renders one primary navigation, user menu, and main landmark", () => {
    render(
      <AppProviders>
        <PageShell title="Problems" description="Browse training problems.">
          <section>Problem content</section>
        </PageShell>
      </AppProviders>,
    );

    expect(screen.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
    expect(screen.getByRole("main")).toBeVisible();
    expect(screen.getByRole("link", { name: "Problems" })).toHaveAttribute("href", "/en/problems");
    expect(screen.getByRole("link", { name: "Contests" })).toHaveAttribute("href", "/en/contests");
    expect(screen.getByRole("link", { name: "Submissions" })).toHaveAttribute("href", "/en/submissions");
    expect(screen.getByRole("button", { name: "Open guest menu" })).toBeVisible();
    expect(screen.queryByText("Lin Chen")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Author" })).not.toBeInTheDocument();
  });

  it("keeps author navigation hidden for a saved user session without the capability", async () => {
    saveSession(window.localStorage, createMockSession(mockUser));

    render(
      <AppProviders>
        <PageShell>
          <section>Problem content</section>
        </PageShell>
      </AppProviders>,
    );

    await waitFor(() => expect(screen.getByRole("button", { name: "Open account menu for Lin Chen" })).toBeVisible());
    expect(screen.queryByRole("link", { name: "Author" })).not.toBeInTheDocument();
  });

  it("exposes author navigation for a validated session with problem.create", async () => {
    saveSession(window.localStorage, createMockSession(mockAuthorUser));

    render(
      <AppProviders>
        <PageShell>
          <section>Problem content</section>
        </PageShell>
      </AppProviders>,
    );

    await waitFor(() => expect(screen.getByRole("button", { name: "Open account menu for Lin Chen" })).toBeVisible());
    expect(screen.getByRole("link", { name: "Author" })).toHaveAttribute("href", "/en/manage/problems");
  });

  it("renders split workspace regions", () => {
    render(<SplitWorkspace primary={<div>Statement</div>} secondary={<div>Judge feedback</div>} />);

    expect(screen.getByText("Statement")).toBeVisible();
    expect(screen.getByText("Judge feedback")).toBeVisible();
  });
});
