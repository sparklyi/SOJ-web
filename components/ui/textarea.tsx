import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/ui/cn";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  helperText?: string;
  error?: string;
};

export function Textarea({ className, id, label, helperText, error, ...props }: TextareaProps) {
  const textareaId = id ?? props.name;
  return (
    <div className="grid gap-2">
      {label ? (
        <label htmlFor={textareaId} className="text-sm font-medium text-soj-text">
          {label}
        </label>
      ) : null}
      <textarea
        id={textareaId}
        className={cn(
          "min-h-28 rounded-soj-md border border-soj-line bg-soj-bg-raised px-3 py-2 text-sm text-soj-text transition placeholder:text-soj-muted/70",
          "focus:border-soj-accent focus:outline-none focus:ring-1 focus:ring-soj-accent disabled:cursor-not-allowed disabled:opacity-45",
          error ? "border-soj-danger focus:border-soj-danger focus:ring-soj-danger" : null,
          className,
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
        {...props}
      />
      {error ? (
        <p id={`${textareaId}-error`} className="text-xs text-soj-danger">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${textareaId}-helper`} className="text-xs text-soj-muted">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
