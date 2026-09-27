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

  it("moves to the previous and next page", () => {
    const { onPageChange } = renderPagination({ page: 2 });

    expect(screen.getByText("Page 2 of 4")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    expect(onPageChange).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("disables the buttons at the edges", () => {
    renderPagination({ page: 1 });
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();

    renderPagination({ page: 4 });
    expect(screen.getAllByRole("button", { name: "Next" }).at(-1)).toBeDisabled();
  });

  it("jumps to an explicit page", () => {
    const { onPageChange } = renderPagination();

    fireEvent.change(screen.getByLabelText("Jump to page"), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("clamps an out-of-range jump input", () => {
    const { onPageChange } = renderPagination();

    fireEvent.change(screen.getByLabelText("Jump to page"), { target: { value: "99" } });
    fireEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(onPageChange).toHaveBeenCalledWith(4);
  });
});
