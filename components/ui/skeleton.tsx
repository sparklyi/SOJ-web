import { cn } from "@/lib/ui/cn";

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("animate-pulse rounded-soj-md bg-soj-surface-2", className)} />;
}
