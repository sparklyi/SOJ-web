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
        /**
         * 扁平银：与 `primary` 同一块金属材料，去掉全部立体修饰（垂直渐变、顶部白边、底边）。
         * 用在「全屏只有一个主操作、周围是大字号排字」的场合——那里镀铬的立体感
         * 会读成旧式拟物，一枚发亮的胶囊和扁平的字排在一起就是两个时代的东西。
         * 材质定义在 app/globals.css 的 `.soj-metal-flat`（源码里不许写颜色字面量）。
         */
        solid: "soj-metal-flat border-transparent",
        secondary:
          "border-soj-line bg-soj-surface text-soj-text hover:border-soj-line-strong hover:bg-soj-surface-2",
        outline:
          "border-soj-line bg-transparent text-soj-muted hover:border-soj-line-strong hover:bg-soj-surface hover:text-soj-text",
        ghost: "border-transparent bg-transparent text-soj-muted hover:bg-soj-surface hover:text-soj-text",
        danger: "border-soj-danger/45 bg-soj-danger/10 text-soj-danger hover:bg-soj-danger/16",
        link: "border-transparent bg-transparent px-0 text-soj-accent underline-offset-4 hover:underline",
        /**
         * 无外观：可点，但**不长成按钮**。
         * 给「整块可点」的区域用——首页的「加入我们」就是这种：那一整行本身就是动作，
         * 给它套上按钮的底色与描边，反而把一个整幅的邀请降级成角落里的小方块。
         * 与 `ghost` 的区别是明确的分工：`ghost` 是「看不见底色的按钮」（仍然有按钮的
         * 尺寸、圆角、内边距，用于工具栏这类需要一排对齐的场合）；
         * `bare` 是「不是按钮的可点区域」，尺寸与排版全部交给调用方，
         * 内容长什么样由调用方决定，这个变体只负责撤掉外观。
         */
        bare: "border-transparent bg-transparent text-inherit",
      },
      size: {
        xs: "h-7 gap-1.5 px-2 text-xs",
        sm: "h-8 px-2.5 text-xs",
        md: "h-9 px-3.5 text-sm",
        lg: "h-11 px-5 text-sm",
        /** 无外观尺寸：撤掉行高、内边距与圆角，排版交给调用方（配合 `variant: "bare"`）。 */
        bare: "h-auto rounded-none p-0",
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
