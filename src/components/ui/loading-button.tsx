import * as React from "react";
import { Button, type ButtonProps } from "./button";
import { cn } from "@/lib/utils";

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
}

export const LoadingButton = React.forwardRef<
  HTMLButtonElement,
  LoadingButtonProps
>(({ children, loading, loadingText, disabled, className, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        loading && "relative text-transparent hover:text-transparent",
        className
      )}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-2 text-primary-foreground">
            {/* Pulsing dots instead of spinner */}
            <div className="flex gap-1">
              <div className="h-2 w-2 rounded-full bg-current animate-pulse" style={{ animationDelay: "0ms" }} />
              <div className="h-2 w-2 rounded-full bg-current animate-pulse" style={{ animationDelay: "150ms" }} />
              <div className="h-2 w-2 rounded-full bg-current animate-pulse" style={{ animationDelay: "300ms" }} />
            </div>
            {loadingText && (
              <span className="text-sm font-semibold">{loadingText}</span>
            )}
          </div>
        </div>
      )}
      <span className={loading ? "invisible" : ""}>{children}</span>
    </Button>
  );
});

LoadingButton.displayName = "LoadingButton";
