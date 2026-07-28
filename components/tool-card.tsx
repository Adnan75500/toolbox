import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { ToolMeta } from "@/lib/tools"
import { getCategory } from "@/lib/tools"
import { cn } from "@/lib/utils"

export function ToolCard({ tool }: { tool: ToolMeta }) {
  const category = getCategory(tool.category)
  const Icon = category?.icon

  const inner = (
    <div
      className={cn(
        "group relative flex h-full flex-col rounded-xl border border-border bg-card p-5 transition-all",
        tool.available
          ? "hover:border-primary/40 hover:shadow-sm"
          : "opacity-70",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          {Icon ? <Icon className="size-5" /> : null}
        </span>
        {tool.available ? (
          <ArrowRight className="size-4 -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
        ) : (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Soon
          </span>
        )}
      </div>
      <h3 className="mt-4 text-sm font-medium leading-tight">{tool.name}</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{tool.description}</p>
    </div>
  )

  if (!tool.available) {
    return <div aria-disabled>{inner}</div>
  }

  return (
    <Link href={`/tools/${tool.category}/${tool.slug}`} className="block h-full">
      {inner}
    </Link>
  )
}
