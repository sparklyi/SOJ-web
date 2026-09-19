import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PermissionGate } from "@/components/auth/permission-gate";
import { PageShell } from "@/components/layout/page-shell";
import { AppProviders } from "@/components/providers/app-providers";
import type { CurrentUser } from "@/lib/api/types";
import { createMockSession, saveSession } from "@/lib/auth/session";
import { ContestManageEntries } from "@/features/contests/detail/contest-manage-entries";
import { mockAdminUser, mockOperatorUser, mockReviewerUser, mockUser } from "@/lib/mock/fixtures";

vi.mock("next/navigation", () => ({
  usePathname: () => "/en",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn() }),
}));

/**
 * `PermissionGate` is the shared route-level guard behind every RBAC surface, so
 * its outcomes are pinned here once instead of once per page. The `override`
 * outcome exists for checks the global permission set cannot express, such as a
 * contest-scoped role read from the contest payload.
 *
 * The contest-scoped cases below rely on the fixture assignments in
 * `lib/mock/fixtures.ts`: user 33 is the `contest_judge` of contest 1 and user 21
 * its `contest_manager`.
 */
const contestJudge: CurrentUser = { ...mockUser, id: 33 };
const contestManager: CurrentUser = { ...mockUser, id: 21 };

function renderWithSession(ui: React.ReactNode, user?: CurrentUser) {
  if (user) saveSession(window.localStorage, createMockSession(user));

  return render(<AppProviders>{ui}</AppProviders>);
}

function renderContestEntries(contestId: number, user?: CurrentUser) {
  return renderWithSession(
    <PageShell title="Contest" description="Contest detail.">
      <ContestManageEntries contestId={contestId} />
    </PageShell>,
    user,
  );
}

describe("permission gate", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("asks an anonymous visitor to sign in", async () => {
    renderWithSession(
      <PermissionGate anyOf={["problem.review"]}>
        <p>review queue</p>
      </PermissionGate>,
    );

    await waitFor(() => expect(screen.getByText("Sign in to continue")).toBeVisible());
    expect(screen.queryByText("review queue")).not.toBeInTheDocument();
  });

  it("denies a signed-in account that lacks the permission", async () => {
    renderWithSession(
      <PermissionGate anyOf={["problem.review"]}>
        <p>review queue</p>
      </PermissionGate>,
      mockUser,
    );

    await waitFor(() => expect(screen.getByText("Permission required")).toBeVisible());
    expect(screen.queryByText("review queue")).not.toBeInTheDocument();
  });

  it("renders the surface when one of anyOf is held", async () => {
    renderWithSession(
      <PermissionGate anyOf={["problem.create", "problem.review"]}>
        <p>review queue</p>
      </PermissionGate>,
      mockReviewerUser,
    );

    await waitFor(() => expect(screen.getByText("review queue")).toBeVisible());
  });

  it("keeps the loading state while an out-of-band check is still resolving", async () => {
    renderWithSession(
      <PermissionGate anyOf={["problem.create", "problem.review"]} override="checking">
        <p>review queue</p>
      </PermissionGate>,
      mockReviewerUser,
    );

    await waitFor(() => expect(screen.getByText("Checking your access…")).toBeVisible());
    expect(screen.queryByText("review queue")).not.toBeInTheDocument();
  });

  it("opens the surface for a granted out-of-band check even without a global permission", async () => {
    renderWithSession(
      <PermissionGate anyOf={["contest.manage_all"]} override="granted">
        <p>contest roles</p>
      </PermissionGate>,
      mockUser,
    );

    await waitFor(() => expect(screen.getByText("contest roles")).toBeVisible());
  });
});

describe("navigation permissions", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  function renderNav(user?: CurrentUser) {
    return renderWithSession(
      <PageShell title="Problems" description="Browse training problems.">
        <section>Problem content</section>
      </PageShell>,
      user,
    );
  }

  it("keeps every management entry hidden from a plain account", async () => {
    renderNav(mockUser);

    await waitFor(() => expect(screen.getByRole("navigation", { name: "Primary navigation" })).toBeVisible());
    expect(screen.queryByRole("link", { name: "Review" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Rejudge" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Users" })).not.toBeInTheDocument();
  });

  it("shows review but not rejudge to a reviewer", async () => {
    renderNav(mockReviewerUser);

    await waitFor(() => expect(screen.getByRole("link", { name: "Review" })).toBeVisible());
    expect(screen.queryByRole("link", { name: "Rejudge" })).not.toBeInTheDocument();
  });

  it("shows the rejudge console to an operator", async () => {
    renderNav(mockOperatorUser);

    await waitFor(() => expect(screen.getByRole("link", { name: "Rejudge" })).toBeVisible());
    expect(screen.queryByRole("link", { name: "Review" })).not.toBeInTheDocument();
  });
});

describe("contest-scoped entries", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("offers nothing to a viewer without an assignment", async () => {
    renderContestEntries(1, mockUser);

    await waitFor(() => expect(screen.getByRole("main")).toBeVisible());
    await waitFor(() => expect(screen.queryByRole("link", { name: "Contest roles" })).not.toBeInTheDocument());
    expect(screen.queryByRole("link", { name: "Rejudge contest" })).not.toBeInTheDocument();
  });

  it("keeps the judge assignment scoped to its own contest", async () => {
    renderContestEntries(2, contestJudge);

    await waitFor(() => expect(screen.getByRole("main")).toBeVisible());
    await waitFor(() => expect(screen.queryByRole("link", { name: "Rejudge contest" })).not.toBeInTheDocument());
    expect(screen.queryByRole("link", { name: "Contest roles" })).not.toBeInTheDocument();
  });

  it("offers rejudge but not role management to a contest judge", async () => {
    renderContestEntries(1, contestJudge);

    await waitFor(() => expect(screen.getByRole("link", { name: "Rejudge contest" })).toBeVisible());
    expect(screen.queryByRole("link", { name: "Contest roles" })).not.toBeInTheDocument();
  });

  it("offers both entries to a contest manager, because judging accepts managers too", async () => {
    renderContestEntries(1, contestManager);

    await waitFor(() => expect(screen.getByRole("link", { name: "Contest roles" })).toBeVisible());
    expect(screen.getByRole("link", { name: "Rejudge contest" })).toBeVisible();
  });

  it("offers both entries to an admin on any contest", async () => {
    renderContestEntries(9, mockAdminUser);

    await waitFor(() => expect(screen.getByRole("link", { name: "Contest roles" })).toBeVisible());
    expect(screen.getByRole("link", { name: "Rejudge contest" })).toBeVisible();
  });
});
