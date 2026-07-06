import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/ui/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

const variants: Record<ButtonVariant, string> = {
  primary: "border-soj-accent bg-soj-accent text-soj-bg hover:bg-soj-accent/90",
  secondary: "border-soj-line bg-soj-surface text-soj-text hover:border-soj-accent/60 hover:bg-soj-surface-2",
  ghost: "border-transparent bg-transparent text-soj-muted hover:bg-soj-surface hover:text-soj-text",
  danger: "border-soj-danger/70 bg-soj-danger/12 text-soj-danger hover:bg-soj-danger/18",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-soj-md border font-medium transition duration-150 ease-out active:translate-y-px disabled:pointer-events-none disabled:opacity-45",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-soj-accent",
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden /> : null}
      {children}
    </button>
  );
}
