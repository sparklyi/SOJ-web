import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/ui/cn";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
};

export function IconButton({ className, label, children, ...props }: IconButtonProps) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-soj-md border border-soj-line bg-soj-surface text-soj-muted transition duration-150 hover:border-soj-accent/60 hover:text-soj-text active:translate-y-px disabled:pointer-events-none disabled:opacity-45",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-soj-accent",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
