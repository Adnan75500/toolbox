import { Lock } from "lucide-react"
import { cn } from "@/lib/utils"

export function PrivacyBadge({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground",
        className,
      )}
    >
      <span className="flex size-2 items-center justify-center">
        <span className="size-2 animate-pulse rounded-full bg-chart-3" />
      </span>
      <Lock className="size-3" />
      Processed locally on your device
    </div>
  )
}
