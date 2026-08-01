"use client"

import imageCompression from "browser-image-compression"
import { Download, Loader2, RotateCcw } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { FileDropzone } from "@/components/file-dropzone"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { downloadBlob, formatBytes } from "@/lib/download"

export default function ImageCompressor() {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [maxSizeMB, setMaxSizeMB] = useState(1)
  const [quality, setQuality] = useState(80)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null)

  function reset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    if (result) URL.revokeObjectURL(result.url)
    setFile(null)
    setPreviewUrl(null)
    setResult(null)
  }

  function onFiles(files: File[]) {
    const f = files[0]
    if (!f.type.startsWith("image/")) {
      toast.error("Please choose an image file.")
      return
    }
    reset()
    setFile(f)
    setPreviewUrl(URL.createObjectURL(f))
  }

  async function compress() {
    if (!file) return
    setBusy(true)
    setResult(null)
    try {
      const blob = await imageCompression(file, {
        maxSizeMB,
        initialQuality: quality / 100,
        useWebWorker: true,
        maxWidthOrHeight: 4096,
      })
      setResult({ blob, url: URL.createObjectURL(blob) })
      toast.success("Image compressed")
    } catch (err) {
      console.log("[v0] compression error:", err)
      toast.error("Could not compress this image. It may be too large for the browser.")
    } finally {
      setBusy(false)
    }
  }

  if (!file) {
    return (
      <FileDropzone
        accept="image/*"
        onFiles={onFiles}
        label="Drop an image to compress"
        hint="JPG, PNG or WebP — processed on your device"
      />
    )
  }

  const savings =
    result && file.size > 0 ? Math.max(0, Math.round((1 - result.blob.size / file.size) * 100)) : 0

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Preview title="Original" url={previewUrl} caption={formatBytes(file.size)} />
        <Preview
          title="Compressed"
          url={result?.url ?? null}
          caption={result ? `${formatBytes(result.blob.size)} · −${savings}%` : "Not yet processed"}
          highlight
        />
      </div>

      <div className="space-y-5 rounded-xl border border-border bg-card p-5">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label>Max file size</Label>
            <span className="text-sm text-muted-foreground">{maxSizeMB} MB</span>
          </div>
          <Slider
            value={[maxSizeMB]}
            min={0.1}
            max={5}
            step={0.1}
            onValueChange={(v) => {
              const next = v[0]
              if (typeof next === "number" && Number.isFinite(next)) {
                setMaxSizeMB(next)
              }
            }}
          />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label>Quality</Label>
            <span className="text-sm text-muted-foreground">{quality}%</span>
          </div>
          <Slider
            value={[quality]}
            min={10}
            max={100}
            step={1}
            onValueChange={(v) => {
              const next = v[0]
              if (typeof next === "number" && Number.isFinite(next)) {
                setQuality(next)
              }
            }}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={compress} disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          {busy ? "Compressing…" : "Compress image"}
        </Button>
        {result && (
          <Button
            variant="secondary"
            onClick={() => downloadBlob(result.blob, `compressed-${file.name}`)}
          >
            <Download className="size-4" />
            Download
          </Button>
        )}
        <Button variant="ghost" onClick={reset}>
          <RotateCcw className="size-4" />
          Start over
        </Button>
      </div>
    </div>
  )
}

function Preview({
  title,
  url,
  caption,
  highlight,
}: {
  title: string
  url: string | null
  caption: string
  highlight?: boolean
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium">{title}</span>
        <span className={highlight ? "text-sm font-medium text-chart-3" : "text-sm text-muted-foreground"}>
          {caption}
        </span>
      </div>
      <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/40">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url || "/placeholder.svg"} alt={title} className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </div>
    </div>
  )
}
