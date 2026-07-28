import { Lock, Zap, WifiOff } from "lucide-react"
import { HomeTools } from "@/components/home-tools"
import { AVAILABLE_TOOL_COUNT, TOTAL_TOOL_COUNT } from "@/lib/tools"

export default function HomePage() {
  return (
    <main>
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-24">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Lock className="size-3 text-chart-3" />
            100% Private — your files never leave your device
          </div>
          <h1 className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            Powerful file tools that run entirely in your browser
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Compress, convert, and edit images, PDFs, video and more. Nothing is ever uploaded —
            all processing happens locally, on your device.
          </p>

          <dl className="mx-auto mt-14 grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-3">
            <Feature
              icon={<Lock className="size-5" />}
              title="Truly private"
              body="No server, no uploads. Files are processed in memory and discarded."
            />
            <Feature
              icon={<WifiOff className="size-5" />}
              title="Works offline"
              body="Once loaded, most tools keep working without a connection."
            />
            <Feature
              icon={<Zap className="size-5" />}
              title="Fast & free"
              body={`${AVAILABLE_TOOL_COUNT} tools live, ${TOTAL_TOOL_COUNT} planned. No sign-up needed.`}
            />
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <HomeTools />
      </section>
    </main>
  )
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
        {icon}
      </span>
      <dt className="mt-3 text-sm font-medium">{title}</dt>
      <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</dd>
    </div>
  )
}
