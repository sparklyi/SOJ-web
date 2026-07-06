import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

describe("ui primitives", () => {
  it("renders a branded button with accessible name", () => {
    render(<Button>Submit</Button>);
    expect(screen.getByRole("button", { name: "Submit" })).toBeVisible();
  });

  it("renders input with label association", () => {
    render(<Input id="handle" label="Handle" />);
    expect(screen.getByLabelText("Handle")).toBeVisible();
  });
});
