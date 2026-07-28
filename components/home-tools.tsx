"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Clock, Search } from "lucide-react"
import { CATEGORIES, TOOLS, getToolBySlug, searchTools } from "@/lib/tools"
import { useRecentTools } from "@/hooks/use-recent-tools"
import { ToolCard } from "@/components/tool-card"
import { Input } from "@/components/ui/input"

export function HomeTools() {
  const [query, setQuery] = useState("")
  const { recent } = useRecentTools()

  const results = useMemo(() => searchTools(query), [query])
  const isSearching = query.trim().length > 0

  const recentTools = recent
    .map((slug) => getToolBySlug(slug))
    .filter((t): t is NonNullable<typeof t> => Boolean(t))

  return (
    <div>
      <div className="relative mx-auto max-w-xl">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${TOOLS.length} tools…`}
          aria-label="Search tools"
          className="h-12 pl-10 text-base"
        />
      </div>

      {!isSearching && recentTools.length > 0 && (
        <section className="mt-14">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-medium text-muted-foreground">Recently used</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentTools.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        </section>
      )}

      {isSearching ? (
        <section className="mt-10">
          <p className="mb-4 text-sm text-muted-foreground">
            {results.length} {results.length === 1 ? "result" : "results"} for “{query}”
          </p>
          {results.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((tool) => (
                <ToolCard key={`${tool.category}-${tool.slug}`} tool={tool} />
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
              No tools match your search.
            </p>
          )}
        </section>
      ) : (
        <div className="mt-16 space-y-16">
          {CATEGORIES.map((category) => {
            const categoryTools = TOOLS.filter((t) => t.category === category.slug)
            return (
              <section key={category.slug} id={category.slug} className="scroll-mt-20">
                <div className="mb-5 flex items-end justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                      <category.icon className="size-5" />
                    </span>
                    <div>
                      <h2 className="text-lg font-semibold tracking-tight">{category.name}</h2>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    </div>
                  </div>
                  <Link
                    href={`/category/${category.slug}`}
                    className="hidden shrink-0 text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
                  >
                    View all
                  </Link>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {categoryTools.map((tool) => (
                    <ToolCard key={tool.slug} tool={tool} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
