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
});
