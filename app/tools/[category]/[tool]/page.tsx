import { notFound } from "next/navigation"
import { TOOLS, getTool } from "@/lib/tools"
import { ToolShell } from "@/components/tool-shell"
import { ToolLoader } from "@/components/tools/tool-loader"
import { ComingSoon } from "@/components/tools/coming-soon"
import { HOW_IT_WORKS, DEFAULT_HOW_IT_WORKS } from "@/lib/how-it-works"

export function generateStaticParams() {
  return TOOLS.map((t) => ({ category: t.category, tool: t.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; tool: string }>
}) {
  const { category, tool } = await params
  const meta = getTool(category, tool)
  if (!meta) return {}
  return {
    title: meta.name,
    description: meta.description,
  }
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ category: string; tool: string }>
}) {
  const { category, tool } = await params
  const meta = getTool(category, tool)
  if (!meta) notFound()

  const steps = HOW_IT_WORKS[meta.slug] ?? DEFAULT_HOW_IT_WORKS

  return (
    <ToolShell tool={meta} howItWorks={steps}>
      {meta.available ? <ToolLoader slug={meta.slug} /> : <ComingSoon tool={meta} />}
    </ToolShell>
  )
}
