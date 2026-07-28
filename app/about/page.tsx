import Link from "next/link"
import { Cpu, Lock, ServerOff, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AVAILABLE_TOOL_COUNT, TOTAL_TOOL_COUNT } from "@/lib/tools"

export const metadata = {
  title: "About",
  description:
    "How ToolBox processes every file locally in your browser — no uploads, no servers, complete privacy.",
}

const points = [
  {
    icon: ServerOff,
    title: "No uploads, ever",
    body: "Files are read with the browser File API and held only in memory. They are never transmitted to any server or third party.",
  },
  {
    icon: Cpu,
    title: "Processed on your device",
    body: "All work happens with client-side APIs — Canvas, Web Crypto, WebAssembly and Web Workers — using your own hardware.",
  },
  {
    icon: WifiOff,
    title: "Works offline",
    body: "Because there is no backend, most tools keep working even without an internet connection once the page has loaded.",
  },
  {
    icon: Lock,
    title: "Nothing to leak",
    body: "There is no database of your files, no analytics on their contents, and nothing stored after you close the tab.",
  },
]

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
        <Lock className="size-3 text-chart-3" />
        Privacy by architecture
      </div>
      <h1 className="mt-6 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
        Your files never leave your device
      </h1>
      <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
        ToolBox is a collection of {TOTAL_TOOL_COUNT} planned utilities ({AVAILABLE_TOOL_COUNT} live
        today) for images, PDFs, video, audio, text and more. Unlike most online tools, ToolBox does
        not have a file-processing backend. Every operation runs entirely inside your browser, which
        means your documents, photos and data stay with you.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {points.map((p) => (
          <div key={p.title} className="rounded-xl border border-border bg-card p-5">
            <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <p.icon className="size-5" />
            </span>
            <h2 className="mt-4 text-sm font-medium">{p.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-xl border border-border bg-muted/30 p-6">
        <h2 className="text-base font-medium">How can I be sure?</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Open your browser&apos;s developer tools and watch the Network tab while you use any tool.
          You will not see your file being uploaded anywhere — the only network requests are for the
          page and its code, which load once and then run locally.
        </p>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Button nativeButton={false} render={<Link href="/" />}>
          Browse all tools
        </Button>
        <Button nativeButton={false} variant="secondary" render={<Link href="/category/image" />}>
          Try the image tools
        </Button>
      </div>
    </main>
  )
}
