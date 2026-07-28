import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { CATEGORIES, getCategory, getToolsByCategory } from "@/lib/tools"
import { ToolCard } from "@/components/tool-card"

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const category = getCategory(slug)
  if (!category) return {}
  return {
    title: `${category.name} Tools`,
    description: category.description,
  }
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const category = getCategory(slug)
  if (!category) notFound()

  const tools = getToolsByCategory(slug)
  const available = tools.filter((t) => t.available).length

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/" className="transition-colors hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">{category.name}</span>
      </nav>

      <div className="mt-6 flex items-center gap-4">
        <span className="flex size-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <category.icon className="size-6" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {category.name} Tools
          </h1>
          <p className="mt-1 text-muted-foreground">{category.description}</p>
        </div>
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        {available} of {tools.length} tools available
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} />
        ))}
      </div>
    </main>
  )
}
