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
  "image-rotator": dynamic(() => import("@/components/tools/image/image-rotator"), {
    loading: Loading,
  }),
  "exif-viewer": dynamic(() => import("@/components/tools/image/exif-viewer"), {
    loading: Loading,
  }),
  "image-base64": dynamic(() => import("@/components/tools/image/image-base64"), {
    loading: Loading,
  }),
  "color-picker": dynamic(() => import("@/components/tools/image/color-picker"), {
    loading: Loading,
  }),
  "collage-maker": dynamic(() => import("@/components/tools/image/collage-maker"), {
    loading: Loading,
  }),
  "meme-generator": dynamic(() => import("@/components/tools/image/meme-generator"), {
    loading: Loading,
  }),
  "svg-converter": dynamic(() => import("@/components/tools/image/svg-converter"), {
    loading: Loading,
  }),
  "favicon-generator": dynamic(() => import("@/components/tools/image/favicon-generator"), {
    loading: Loading,
  }),

  // PDF Tools
  "merge-pdf": dynamic(() => import("@/components/tools/pdf/merge-pdf"), { loading: Loading }),
  "split-pdf": dynamic(() => import("@/components/tools/pdf/split-pdf"), { loading: Loading }),
  "extract-pages": dynamic(() => import("@/components/tools/pdf/extract-pages"), { loading: Loading }),
  "organize-pdf": dynamic(() => import("@/components/tools/pdf/organize-pdf"), { loading: Loading }),
  "rotate-pdf": dynamic(() => import("@/components/tools/pdf/rotate-pdf"), { loading: Loading }),
  "crop-pdf": dynamic(() => import("@/components/tools/pdf/crop-pdf"), { loading: Loading }),
  "protect-pdf": dynamic(() => import("@/components/tools/pdf/protect-pdf"), { loading: Loading }),
  "watermark-pdf": dynamic(() => import("@/components/tools/pdf/watermark-pdf"), { loading: Loading }),
  "page-numbers": dynamic(() => import("@/components/tools/pdf/page-numbers"), { loading: Loading }),
  "header-footer": dynamic(() => import("@/components/tools/pdf/header-footer"), { loading: Loading }),
  "pdf-metadata": dynamic(() => import("@/components/tools/pdf/pdf-metadata"), { loading: Loading }),
  "compress-pdf": dynamic(() => import("@/components/tools/pdf/compress-pdf"), { loading: Loading }),
  "extract-images": dynamic(() => import("@/components/tools/pdf/extract-images"), { loading: Loading }),
  "extract-text": dynamic(() => import("@/components/tools/pdf/extract-text"), { loading: Loading }),
  "pdf-to-image": dynamic(() => import("@/components/tools/pdf/pdf-to-image"), { loading: Loading }),
  "image-to-pdf": dynamic(() => import("@/components/tools/pdf/image-to-pdf"), { loading: Loading }),
  "pdf-info": dynamic(() => import("@/components/tools/pdf/pdf-info"), { loading: Loading }),

  // Video Tools
  "video-trimmer": dynamic(() => import("@/components/tools/video/video-trimmer"), { loading: Loading }),
  "video-compressor": dynamic(() => import("@/components/tools/video/video-compressor"), { loading: Loading }),
  "video-converter": dynamic(() => import("@/components/tools/video/video-converter"), { loading: Loading }),
  "extract-audio": dynamic(() => import("@/components/tools/video/extract-audio"), { loading: Loading }),
  "video-to-gif": dynamic(() => import("@/components/tools/video/video-to-gif"), { loading: Loading }),
  "screen-recorder": dynamic(() => import("@/components/tools/video/screen-recorder"), { loading: Loading }),
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
