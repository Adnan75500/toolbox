"use client"

import { Download, Link2, Link2Off, Loader2, RotateCcw } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { FileDropzone } from "@/components/file-dropzone"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { downloadBlob, formatBytes, replaceExtension } from "@/lib/download"
import { canvasToBlob, loadImage, readFileAsDataURL } from "@/lib/image"

export default function ImageResizer() {
  const [file, setFile] = useState<File | null>(null)
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  const [lockRatio, setLockRatio] = useState(true)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null)

  const ratio = img ? img.naturalWidth / img.naturalHeight : 1

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
      setWidth(image.naturalWidth)
      setHeight(image.naturalHeight)
    } catch {
      toast.error("Could not read that image.")
    }
  }

  function updateWidth(value: number) {
    setWidth(value)
    if (lockRatio && value > 0) setHeight(Math.round(value / ratio))
  }

  function updateHeight(value: number) {
    setHeight(value)
    if (lockRatio && value > 0) setWidth(Math.round(value * ratio))
  }

  async function resize() {
    if (!img || !file || width < 1 || height < 1) return
    setBusy(true)
    setResult(null)
    try {
      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("no ctx")
      ctx.imageSmoothingQuality = "high"
      ctx.drawImage(img, 0, 0, width, height)
      const type = file.type === "image/png" ? "image/png" : "image/jpeg"
      const blob = await canvasToBlob(canvas, type, 0.92)
      setResult({ blob, url: URL.createObjectURL(blob) })
      toast.success("Image resized")
    } catch (err) {
      console.log("[v0] resize error:", err)
      toast.error("Could not resize this image.")
    } finally {
      setBusy(false)
    }
  }

  if (!file || !img) {
    return (
      <FileDropzone
        accept="image/*"
        onFiles={onFiles}
        label="Drop an image to resize"
        hint="Processed on your device with the Canvas API"
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
        <span className="text-sm text-muted-foreground">
          Original: {img.naturalWidth} × {img.naturalHeight}px · {formatBytes(file.size)}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
        <div>
          <Label htmlFor="w">Width (px)</Label>
          <Input
            id="w"
            type="number"
            min={1}
            value={width || ""}
            onChange={(e) => updateWidth(Number(e.target.value))}
            className="mt-1.5"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          aria-label={lockRatio ? "Unlock aspect ratio" : "Lock aspect ratio"}
          onClick={() => setLockRatio((v) => !v)}
          className="mb-0.5"
        >
          {lockRatio ? <Link2 className="size-4" /> : <Link2Off className="size-4" />}
        </Button>
        <div>
          <Label htmlFor="h">Height (px)</Label>
          <Input
            id="h"
            type="number"
            min={1}
            value={height || ""}
            onChange={(e) => updateHeight(Number(e.target.value))}
            className="mt-1.5"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[25, 50, 75].map((pct) => (
          <Button
            key={pct}
            variant="secondary"
            size="sm"
            onClick={() => {
              setWidth(Math.round(img.naturalWidth * (pct / 100)))
              setHeight(Math.round(img.naturalHeight * (pct / 100)))
            }}
          >
            {pct}%
          </Button>
        ))}
      </div>

      {result && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">Result</span>
            <span className="text-sm text-muted-foreground">
              {width} × {height}px · {formatBytes(result.blob.size)}
            </span>
          </div>
          <div className="flex max-h-80 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/40 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={result.url || "/placeholder.svg"} alt="Resized result" className="max-h-72 max-w-full object-contain" />
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Button onClick={resize} disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          Resize image
        </Button>
        {result && (
          <Button
            variant="secondary"
            onClick={() => downloadBlob(result.blob, replaceExtension(`resized-${file.name}`, file.type === "image/png" ? "png" : "jpg"))}
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
