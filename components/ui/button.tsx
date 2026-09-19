import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/ui/cn";

/**
 * Button。
 *
 * 主操作不用彩色，用一块**金属银**（.soj-metal）：上亮下暗的垂直渐变、
 * 顶部白边、底部暗边——它因此成为整个页面上最亮的东西，层级不靠饱和色也成立。
 * 深色界面里给按钮加彩色外发光只会显得廉价，所以这里没有任何 glow 阴影。
 *
 * `buttonVariants` 单独导出，链接按钮（next/link）直接复用同一套视觉。
 */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-soj-md border font-medium transition-[background-color,border-color,color,transform] duration-150 ease-out active:translate-y-px disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      variant: {
        primary: "soj-metal border-transparent",
        secondary:
          "border-soj-line bg-soj-surface text-soj-text hover:border-soj-line-strong hover:bg-soj-surface-2",
        outline:
          "border-soj-line bg-transparent text-soj-muted hover:border-soj-line-strong hover:bg-soj-surface hover:text-soj-text",
        ghost: "border-transparent bg-transparent text-soj-muted hover:bg-soj-surface hover:text-soj-text",
        danger: "border-soj-danger/45 bg-soj-danger/10 text-soj-danger hover:bg-soj-danger/16",
        link: "border-transparent bg-transparent px-0 text-soj-accent underline-offset-4 hover:underline",
      },
      size: {
        xs: "h-7 gap-1.5 px-2 text-xs",
        sm: "h-8 px-2.5 text-xs",
        md: "h-9 px-3.5 text-sm",
        lg: "h-11 px-5 text-sm",
      },
      iconOnly: {
        true: "aspect-square px-0",
        false: "",
      },
    },
    compoundVariants: [
      { size: "xs", iconOnly: true, class: "w-7" },
      { size: "sm", iconOnly: true, class: "w-8" },
      { size: "md", iconOnly: true, class: "w-9" },
      { size: "lg", iconOnly: true, class: "w-11" },
      { variant: "link", size: ["xs", "sm", "md", "lg"], class: "h-auto" },
    ],
    defaultVariants: {
      variant: "primary",
      size: "md",
      iconOnly: false,
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean;
  };

export function Button({
  className,
  variant = "primary",
  size = "md",
  iconOnly = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, iconOnly }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" /> : null}
      {children}
    </button>
  );
}

export { buttonVariants };
export type { ButtonProps };
