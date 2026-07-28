"use client"

import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"
import type { ComponentType } from "react"

function Loading() {
  return (
    <div className="flex min-h-52 items-center justify-center rounded-xl border border-border bg-muted/30">
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
    </div>
  )
}

// Lazy-load each tool so heavy libraries are only fetched when the tool opens.
const REGISTRY: Record<string, ComponentType> = {
  "image-compressor": dynamic(() => import("@/components/tools/image/image-compressor"), {
    loading: Loading,
  }),
  "image-resizer": dynamic(() => import("@/components/tools/image/image-resizer"), {
    loading: Loading,
  }),
  "image-cropper": dynamic(() => import("@/components/tools/image/image-cropper"), {
    loading: Loading,
  }),
  "format-converter": dynamic(() => import("@/components/tools/image/format-converter"), {
    loading: Loading,
  }),
  "watermark-adder": dynamic(() => import("@/components/tools/image/watermark-adder"), {
    loading: Loading,
  }),
}

export function ToolLoader({ slug }: { slug: string }) {
  const Component = REGISTRY[slug]
  if (!Component) {
    return (
      <p className="text-sm text-muted-foreground">This tool is not available yet.</p>
    )
  }
  return <Component />
}
