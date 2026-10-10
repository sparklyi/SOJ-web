import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { MathText } from "@/components/soj/math-text";

/**
 * 题面渲染的回归点：真实题面里 `` `even` `` 这种行内代码必须变成 <code>，
 * 否则反引号会原样露出。同时钉住 $...$ 的公式与 **加粗** 不被打回纯文本。
 */
describe("MathText", () => {
  it("renders backticked literals as inline code", () => {
    const { container } = render(<MathText text={"如果 n 是偶数，输出 `even`；否则输出 `odd`。"} />);
    const codes = container.querySelectorAll("code");
    expect(Array.from(codes).map((node) => node.textContent)).toEqual(["even", "odd"]);
    expect(container.textContent).not.toContain("`");
  });

  it("renders inline math through KaTeX", () => {
    const { container } = render(<MathText text={"对于 $n \\le 10^9$ 成立。"} />);
    expect(container.querySelector(".katex")).not.toBeNull();
  });

  it("renders bold spans", () => {
    const { container } = render(<MathText text={"**注意** 32 位整数可能溢出。"} />);
    expect(container.querySelector("strong")?.textContent).toBe("注意");
  });

  it("keeps code spans literal when they contain dollar signs", () => {
    const { container } = render(<MathText text={"打印 `$1` 这个字面量。"} />);
    expect(container.querySelector("code")?.textContent).toBe("$1");
    expect(container.querySelector(".katex")).toBeNull();
  });

  it("preserves angle brackets in inline formulas", () => {
    const { container } = render(<MathText text={"For $a < b > c$ compare the values."} />);
    expect(container.querySelector(".katex")?.textContent).toContain("<");
    expect(container.textContent).not.toContain("lt;");
    expect(container.textContent).not.toContain("gt;");
  });

  it("preserves matrix alignment ampersands in display formulas", () => {
    const { container } = render(<MathText text={"$$\\begin{pmatrix}1 & 2 \\\\ 3 & 4\\end{pmatrix}$$"} />);
    expect(container.querySelector(".katex-display")).not.toBeNull();
    expect(container.querySelector(".katex-error")).toBeNull();
    expect(container.textContent).not.toContain("amp;");
  });

  it("shows invalid or unsupported formulas without crashing and exposes preview errors", () => {
    const { container, getByText } = render(<MathText text={"Bad $\\frac{1}{$ and $\\unknowncommand$"} errorLabel="Formula error" />);
    expect(getByText(/Formula error:.*expected/i)).toBeInTheDocument();
    expect(getByText(/Formula error:.*Undefined control sequence/)).toBeInTheDocument();
    expect(container.querySelectorAll("li")).toHaveLength(2);
  });

  it("escapes HTML in plain text, bold, inline code and formula error messages", () => {
    const { container } = render(<MathText text={'<img src=x onerror=alert(1)> **<script>bold</script>** `<iframe>code</iframe>` $\\unknown{<img src=x>}$'} errorLabel="Formula error" />);
    expect(container.querySelector("img,script,iframe")).toBeNull();
    expect(container.querySelector("strong")?.textContent).toBe("<script>bold</script>");
    expect(container.querySelector("code")?.textContent).toBe("<iframe>code</iframe>");
    expect(container.textContent).toContain("<img src=x onerror=alert(1)>");
  });

  it("keeps KaTeX trusted HTML and URL commands disabled", () => {
    const { container } = render(<MathText text={"$\\href{javascript:alert(1)}{click}$"} />);
    expect(container.querySelector("a")).toBeNull();
  });
});
