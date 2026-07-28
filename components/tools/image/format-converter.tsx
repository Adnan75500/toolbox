"use client"

import { Download, Loader2, RotateCcw } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { FileDropzone } from "@/components/file-dropzone"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { downloadBlob, formatBytes, replaceExtension } from "@/lib/download"
import { MIME_BY_FORMAT, canvasToBlob, loadImage, readFileAsDataURL } from "@/lib/image"

const FORMATS = ["jpg", "png", "webp", "bmp"] as const
type Format = (typeof FORMATS)[number]

export default function FormatConverter() {
  const [file, setFile] = useState<File | null>(null)
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [format, setFormat] = useState<Format>("webp")
  const [quality, setQuality] = useState(90)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null)

  const lossy = format === "jpg" || format === "webp"

  function reset() {
    if (result) URL.revokeObjectURL(result.url)
    setFile(null)
    setImg(null)
    setResult(null)
  }

  async function onFiles(files: File[]) {
    const f = files[0]
    if (!f.type.startsWith("image/")) {
      toast.error("Please choose an image file.")
      return
    }
    reset()
    try {
      const dataUrl = await readFileAsDataURL(f)
      const image = await loadImage(dataUrl)
      setFile(f)
      setImg(image)
    } catch {
      toast.error("Could not read that image.")
    }
  }

  async function convert() {
    if (!img || !file) return
    setBusy(true)
    setResult(null)
    try {
      const canvas = document.createElement("canvas")
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("no ctx")
      // Fill white background for formats without transparency.
      if (format === "jpg" || format === "bmp") {
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
      ctx.drawImage(img, 0, 0)
      const mime = MIME_BY_FORMAT[format]
      const blob = await canvasToBlob(canvas, mime, lossy ? quality / 100 : undefined)
      if (blob.type !== mime && format === "webp") {
        toast.error("This browser can't export WebP.")
        return
      }
      setResult({ blob, url: URL.createObjectURL(blob) })
      toast.success(`Converted to ${format.toUpperCase()}`)
    } catch (err) {
      console.log("[v0] convert error:", err)
      toast.error("Could not convert this image.")
    } finally {
      setBusy(false)
    }
  }

  if (!file || !img) {
    return (
      <FileDropzone
        accept="image/*"
        onFiles={onFiles}
        label="Drop an image to convert"
        hint="JPG, PNG, WebP or BMP"
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        {file.name} · {img.naturalWidth} × {img.naturalHeight}px · {formatBytes(file.size)}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label className="mb-1.5 block">Output format</Label>
          <Select value={format} onValueChange={(v) => setFormat(v as Format)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FORMATS.map((f) => (
                <SelectItem key={f} value={f}>
                  {f.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {lossy && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Quality</Label>
              <span className="text-sm text-muted-foreground">{quality}%</span>
            </div>
            <Slider value={[quality]} min={10} max={100} step={1} onValueChange={(v) => setQuality(v[0])} />
          </div>
        )}
      </div>

      {result && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">Result</span>
            <span className="text-sm text-muted-foreground">{formatBytes(result.blob.size)}</span>
          </div>
          <div className="flex max-h-72 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/40 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={result.url || "/placeholder.svg"} alt="Converted result" className="max-h-64 max-w-full object-contain" />
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Button onClick={convert} disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          Convert to {format.toUpperCase()}
        </Button>
        {result && (
          <Button
            variant="secondary"
            onClick={() => downloadBlob(result.blob, replaceExtension(file.name, format))}
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
