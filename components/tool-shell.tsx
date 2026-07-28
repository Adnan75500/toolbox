"use client"

import Link from "next/link"
import { useEffect } from "react"
import { ChevronRight } from "lucide-react"
import type { ToolMeta } from "@/lib/tools"
import { getCategory } from "@/lib/tools"
import { trackToolVisit } from "@/hooks/use-recent-tools"
import { PrivacyBadge } from "@/components/privacy-badge"

interface HowItWorksStep {
  title: string
  body: string
}

interface ToolShellProps {
  tool: ToolMeta
  howItWorks: HowItWorksStep[]
  children: React.ReactNode
}

export function ToolShell({ tool, howItWorks, children }: ToolShellProps) {
  const category = getCategory(tool.category)

  useEffect(() => {
    trackToolVisit(tool.slug)
  }, [tool.slug])

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/" className="transition-colors hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="size-3.5" />
        <Link href={`/category/${tool.category}`} className="transition-colors hover:text-foreground">
          {category?.name}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">{tool.name}</span>
      </nav>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{tool.name}</h1>
          <p className="mt-2 max-w-xl text-pretty leading-relaxed text-muted-foreground">
            {tool.description}
          </p>
        </div>
        <PrivacyBadge className="shrink-0" />
      </div>

      <div className="mt-8">{children}</div>

      <section className="mt-14 border-t border-border/60 pt-8">
        <h2 className="text-sm font-medium">How it works</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-3">
          {howItWorks.map((step, i) => (
            <li key={step.title} className="rounded-xl border border-border bg-card p-4">
              <span className="flex size-6 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                {i + 1}
              </span>
              <h3 className="mt-3 text-sm font-medium">{step.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
          Everything above runs inside your browser using the File and Canvas APIs. Your files are
          never sent to a server.
        </p>
      </section>
    </main>
  )
}
