import Link from "next/link"
import { Hammer } from "lucide-react"
import { getToolsByCategory, type ToolMeta } from "@/lib/tools"
import { Button } from "@/components/ui/button"

export function ComingSoon({ tool }: { tool: ToolMeta }) {
  const siblings = getToolsByCategory(tool.category).filter(
    (t) => t.available && t.slug !== tool.slug,
  )

  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/30 p-10 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-background text-primary shadow-sm">
        <Hammer className="size-6" />
      </span>
      <h2 className="mt-4 text-lg font-medium">This tool is coming soon</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {tool.name} is on our roadmap and will run 100% in your browser, just like the tools that
        are already live. Check back shortly.
      </p>

      {siblings.length > 0 && (
        <div className="mt-6">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Available now in this category
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {siblings.map((t) => (
              <Button
                key={t.slug}
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<Link href={`/tools/${t.category}/${t.slug}`} />}
              >
                {t.name}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
