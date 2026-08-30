import { Clock, AlertTriangle, PackageCheck } from "lucide-react";
import { formatCountdown, formatUkDate, formatUkDateTime, type ShopWindow } from "@/hooks/useShopWindow";

interface Props {
  window: ShopWindow;
  className?: string;
}

/** Countdown / closure notice shown on the shop and product pages. */
export function ShopWindowBanner({ window: w, className = "" }: Props) {
  if (w.loading) return null;

  if (!w.isOpen) {
    return (
      <div className={`bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3 ${className}`}>
        <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-amber-200 font-display">
            The club shop is currently closed for orders. You can still browse our products.
          </p>
          <p className="text-xs text-amber-200/70 mt-1">
            We open the shop in short windows so we can print and pack every order ourselves — keep an eye out for the next one.
          </p>
        </div>
      </div>
    );
  }

  if (w.msLeft === null) return null;

  const urgent = w.msLeft < 48 * 3600 * 1000;

  return (
    <div
      className={`rounded-xl p-4 border ${urgent ? "border-red-500/40 bg-red-500/10" : "border-primary/30 bg-primary/5"} ${className}`}
    >
      <div className="flex items-center gap-3">
        <Clock className={`h-5 w-5 shrink-0 ${urgent ? "text-red-400" : "text-primary"}`} />
        <div className="flex-1 min-w-0">
          <p className="font-display text-sm tracking-wider uppercase text-foreground">
            Ordering window closes in{" "}
            <span className={urgent ? "text-red-400" : "text-primary"}>{formatCountdown(w.msLeft)}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Orders close {w.closesAt ? formatUkDateTime(w.closesAt) : ""}
          </p>
        </div>
      </div>
      {w.readyBy && (
        <div className="flex items-start gap-2 mt-3 pt-3 border-t border-border/50">
          <PackageCheck className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            All printing is done in-house — please allow {w.readyDays} days after the shop closes for your order to be
            ready (approx. <span className="text-foreground">{formatUkDate(w.readyBy)}</span>).
          </p>
        </div>
      )}
    </div>
  );
}
