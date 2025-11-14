import { AlertCircle, AlertTriangle, Info, XCircle, RefreshCw, Mail } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import { Button } from "./button";
import { cn } from "@/lib/utils";

type ErrorSeverity = "error" | "warning" | "info";

interface ErrorMessageProps {
  title?: string;
  message: string;
  severity?: ErrorSeverity;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  showSupport?: boolean;
  className?: string;
}

export function ErrorMessage({
  title,
  message,
  severity = "error",
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  showSupport = false,
  className
}: ErrorMessageProps) {
  const icons = {
    error: XCircle,
    warning: AlertTriangle,
    info: Info
  };

  const Icon = icons[severity];

  const variants = {
    error: "destructive",
    warning: "default",
    info: "default"
  } as const;

  return (
    <Alert variant={variants[severity]} className={cn("animate-in fade-in slide-in-from-top-2 duration-300", className)}>
      <Icon className="h-5 w-5" />
      {title && <AlertTitle className="font-semibold">{title}</AlertTitle>}
      <AlertDescription className="mt-2">
        <p className="text-sm">{message}</p>

        {(actionLabel || secondaryActionLabel || showSupport) && (
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            {actionLabel && onAction && (
              <Button onClick={onAction} variant="outline" size="sm">
                {actionLabel}
              </Button>
            )}
            {secondaryActionLabel && onSecondaryAction && (
              <Button onClick={onSecondaryAction} variant="ghost" size="sm">
                {secondaryActionLabel}
              </Button>
            )}
            {showSupport && (
              <Button
                onClick={() => window.location.href = "mailto:support@craftchicago.com"}
                variant="ghost"
                size="sm"
              >
                <Mail className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
            )}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}

// Predefined error messages for common scenarios

export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorMessage
      title="Connection Error"
      message="We're having trouble connecting to our servers. Please check your internet connection and try again."
      severity="error"
      actionLabel="Try Again"
      onAction={onRetry || (() => window.location.reload())}
      showSupport={true}
    />
  );
}

export function NotFoundError({ itemType = "item", onGoBack }: { itemType?: string; onGoBack?: () => void }) {
  return (
    <ErrorMessage
      title={`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} Not Found`}
      message={`The ${itemType} you're looking for doesn't exist or has been removed. It may have been sold or the seller removed it.`}
      severity="warning"
      actionLabel="Go Back"
      onAction={onGoBack || (() => window.history.back())}
      secondaryActionLabel="Browse Products"
      onSecondaryAction={() => window.location.href = "/chicago/browse"}
    />
  );
}

export function PermissionError() {
  return (
    <ErrorMessage
      title="Access Denied"
      message="You don't have permission to access this page. Please sign in or contact support if you believe this is an error."
      severity="warning"
      actionLabel="Sign In"
      onAction={() => window.location.href = "/auth"}
      showSupport={true}
    />
  );
}

export function ValidationError({ fields }: { fields?: string[] }) {
  const message = fields && fields.length > 0
    ? `Please check the following fields: ${fields.join(", ")}`
    : "Please check your input and try again.";

  return (
    <ErrorMessage
      title="Validation Error"
      message={message}
      severity="warning"
    />
  );
}

export function PaymentError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorMessage
      title="Payment Failed"
      message="Your payment couldn't be processed. Please check your payment details and try again, or contact your bank if the problem persists."
      severity="error"
      actionLabel="Try Again"
      onAction={onRetry}
      showSupport={true}
    />
  );
}

export function OutOfStockError({ productName, onBrowse }: { productName?: string; onBrowse?: () => void }) {
  return (
    <ErrorMessage
      title="Out of Stock"
      message={productName
        ? `${productName} is currently out of stock. The seller will be notified and may restock soon.`
        : "This item is currently out of stock."}
      severity="info"
      actionLabel="Browse Similar Items"
      onAction={onBrowse || (() => window.location.href = "/chicago/browse")}
    />
  );
}

export function SessionExpiredError() {
  return (
    <ErrorMessage
      title="Session Expired"
      message="Your session has expired for security reasons. Please sign in again to continue."
      severity="warning"
      actionLabel="Sign In"
      onAction={() => window.location.href = "/auth"}
    />
  );
}
