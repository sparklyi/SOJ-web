import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/ui/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  helperText?: string;
  error?: string;
};

export function Input({ className, id, label, helperText, error, ...props }: InputProps) {
  const inputId = id ?? props.name;
  return (
    <div className="grid gap-2">
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-soj-text">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={cn(
          "h-10 rounded-soj-md border border-soj-line bg-soj-bg-raised px-3 text-sm text-soj-text transition placeholder:text-soj-muted/70",
          "shadow-[inset_0_1px_0_rgb(255_255_255/0.04)] focus:border-soj-accent focus:outline-none focus:ring-1 focus:ring-soj-accent disabled:cursor-not-allowed disabled:opacity-45",
          error ? "border-soj-danger focus:border-soj-danger focus:ring-soj-danger" : null,
          className,
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} className="text-xs text-soj-danger">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${inputId}-helper`} className="text-xs text-soj-muted">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
