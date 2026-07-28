import Link from "next/link"
import { ShieldCheck } from "lucide-react"
import { CATEGORIES } from "@/lib/tools"

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div className="max-w-xs">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <ShieldCheck className="size-4" />
              </span>
              ToolBox
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              A privacy-first suite of file tools. Everything runs in your browser — your files
              never leave your device.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <h3 className="text-sm font-medium">Categories</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {CATEGORIES.slice(0, 5).map((cat) => (
                  <li key={cat.slug}>
                    <Link
                      href={`/category/${cat.slug}`}
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium">More</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {CATEGORIES.slice(5).map((cat) => (
                  <li key={cat.slug}>
                    <Link
                      href={`/category/${cat.slug}`}
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium">Company</h3>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link
                    href="/about"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    About
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-border/60 pt-6 text-sm text-muted-foreground">
          <p>Built for privacy. No uploads, no tracking of your files, ever.</p>
        </div>
      </div>
    </footer>
  )
}
