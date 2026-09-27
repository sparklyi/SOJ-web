import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { I18nProvider } from "@/components/providers/i18n-provider";
import { Pagination } from "@/components/ui/pagination";

function renderPagination(props: Partial<React.ComponentProps<typeof Pagination>> = {}) {
  const onPageChange = vi.fn();
  render(
    <I18nProvider locale="en">
      <Pagination page={1} pageSize={20} total={61} onPageChange={onPageChange} {...props} />
    </I18nProvider>,
  );
  return { onPageChange };
}

describe("pagination", () => {
  it("renders nothing when everything fits on one page", () => {
    const { container } = render(
      <I18nProvider locale="en">
        <Pagination page={1} pageSize={20} total={8} onPageChange={vi.fn()} />
      </I18nProvider>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders clickable page numbers and the total, without a manual jump input", () => {
    renderPagination();

    expect(screen.getByRole("button", { name: "1" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "4" })).toBeVisible();
    expect(screen.getByText("61 total")).toBeVisible();
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
  });

  it("switches pages by clicking a number", () => {
    const { onPageChange } = renderPagination();

    fireEvent.click(screen.getByRole("button", { name: "3" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("moves to the previous and next page", () => {
    const { onPageChange } = renderPagination({ page: 2 });

    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    expect(onPageChange).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("disables the arrows at the edges", () => {
    renderPagination({ page: 1 });
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();

    renderPagination({ page: 4 });
    expect(screen.getAllByRole("button", { name: "Next" }).at(-1)).toBeDisabled();
  });

  it("collapses long ranges with ellipses around the current page", () => {
    renderPagination({ page: 5, pageSize: 20, total: 200 });

    expect(screen.getAllByRole("button").map((button) => button.textContent)).toEqual(["", "1", "4", "5", "6", "10", ""]);
    expect(screen.getAllByText("…")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "5" })).toHaveAttribute("aria-current", "page");
  });
});
