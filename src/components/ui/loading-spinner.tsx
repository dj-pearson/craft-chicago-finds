import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

export function LoadingSpinner({ 
  size = "md", 
  className,
  text = "Loading..." 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  };

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[200px] space-y-4"
      role="status"
      aria-label={text}
      aria-busy="true"
    >
      <Loader2
        className={cn(
          "animate-spin text-primary",
          sizeClasses[size],
          className
        )}
        aria-hidden="true"
      />
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse" aria-hidden="true">
          {text}
        </p>
      )}
      <span className="sr-only">{text}</span>
    </div>
  );
}