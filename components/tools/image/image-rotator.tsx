"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Download,
  RefreshCw,
  Sliders,
} from "lucide-react"
import { toast } from "sonner"
import { FileDropzone } from "@/components/file-dropzone"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { downloadBlob, formatBytes } from "@/lib/download"
import { loadImage } from "@/lib/image"

export default function ImageRotator() {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [angle, setAngle] = useState(0) // degrees
  const [flipH, setFlipH] = useState(false)
  const [flipV, setFlipV] = useState(false)
  const [format, setFormat] = useState<"png" | "jpeg" | "webp">("png")
  const [bgMode, setBgMode] = useState<"transparent" | "white" | "black">("transparent")
  const [outputUrl, setOutputUrl] = useState<string | null>(null)
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null)
  const [outputDimensions, setOutputDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 })
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  function resetAll() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    if (outputUrl) URL.revokeObjectURL(outputUrl)
    setFile(null)
    setPreviewUrl(null)
    setAngle(0)
    setFlipH(false)
    setFlipV(false)
    setOutputUrl(null)
    setOutputBlob(null)
  }

  function onFiles(files: File[]) {
    const f = files[0]
    if (!f.type.startsWith("image/")) {
      toast.error("Please choose a valid image file.")
      return
    }
    resetAll()
    setFile(f)
    setPreviewUrl(URL.createObjectURL(f))
  }

  const renderCanvas = useCallback(async () => {
    if (!previewUrl) return
    try {
      const img = await loadImage(previewUrl)
      const rad = (angle * Math.PI) / 180

      // Calculate bounding box after rotation
      const sin = Math.abs(Math.sin(rad))
      const cos = Math.abs(Math.cos(rad))
      const newWidth = Math.round(img.width * cos + img.height * sin)
      const newHeight = Math.round(img.width * sin + img.height * cos)

      const canvas = document.createElement("canvas")
      canvas.width = newWidth
      canvas.height = newHeight
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Handle background fill
      if (bgMode === "white") {
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, newWidth, newHeight)
      } else if (bgMode === "black") {
        ctx.fillStyle = "#000000"
        ctx.fillRect(0, 0, newWidth, newHeight)
      } else {
        ctx.clearRect(0, 0, newWidth, newHeight)
      }

      ctx.save()
      // Move to center
      ctx.translate(newWidth / 2, newHeight / 2)
      // Rotate
      ctx.rotate(rad)
      // Flip
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1)
      // Draw image centered
      ctx.drawImage(img, -img.width / 2, -img.height / 2)
      ctx.restore()

      const mime = `image/${format}`
      canvas.toBlob((blob) => {
        if (!blob) return
        if (outputUrl) URL.revokeObjectURL(outputUrl)
        setOutputBlob(blob)
        setOutputUrl(URL.createObjectURL(blob))
        setOutputDimensions({ width: newWidth, height: newHeight })
      }, mime, 0.92)
    } catch {
      toast.error("Error processing image rotation.")
    }
  }, [previewUrl, angle, flipH, flipV, format, bgMode, outputUrl])

  useEffect(() => {
    renderCanvas()
  }, [renderCanvas])

  if (!file) {
    return (
      <FileDropzone
        accept="image/*"
        onFiles={onFiles}
        label="Drop an image to rotate or flip"
        hint="JPG, PNG, WebP, SVG — Processed 100% locally in your browser"
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Control Toolbar */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAngle((prev) => (prev - 90 + 360) % 360)}
              title="Rotate 90° Counter-Clockwise"
            >
              <RotateCcw className="size-4 mr-1" /> -90°
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAngle((prev) => (prev + 90) % 360)}
              title="Rotate 90° Clockwise"
            >
              <RotateCw className="size-4 mr-1" /> +90°
            </Button>
            <Button
              variant={flipH ? "default" : "outline"}
              size="sm"
              onClick={() => setFlipH(!flipH)}
              title="Flip Horizontal (Mirror Left-Right)"
            >
              <FlipHorizontal className="size-4 mr-1" /> Flip H
            </Button>
            <Button
              variant={flipV ? "default" : "outline"}
              size="sm"
              onClick={() => setFlipV(!flipV)}
              title="Flip Vertical (Mirror Top-Bottom)"
            >
              <FlipVertical className="size-4 mr-1" /> Flip V
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Label className="text-xs">Background:</Label>
              <Select value={bgMode} onValueChange={(v: any) => setBgMode(v)}>
                <SelectTrigger className="w-28 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transparent">Transparent</SelectItem>
                  <SelectItem value="white">White</SelectItem>
                  <SelectItem value="black">Black</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs">Format:</Label>
              <Select value={format} onValueChange={(v: any) => setFormat(v)}>
                <SelectTrigger className="w-24 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="jpeg">JPG</SelectItem>
                  <SelectItem value="webp">WebP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Custom Angle Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium flex items-center gap-1">
              <Sliders className="size-3.5" /> Rotation Angle:
            </span>
            <span className="font-mono">{Math.round(angle)}°</span>
          </div>
          <Slider
            value={[angle]}
            min={0}
            max={359}
            step={1}
            onValueChange={(v) => setAngle(v[0])}
          />
        </div>
      </div>

      {/* Main Interactive Preview */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm font-medium">
            <span>Original</span>
            <span className="text-xs text-muted-foreground">{formatBytes(file.size)}</span>
          </div>
          <div className="aspect-square flex items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/30 p-2">
            {previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Original" className="max-h-full max-w-full object-contain" />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm font-medium">
            <span className="text-primary font-semibold">Transformed Preview</span>
            {outputDimensions.width > 0 && (
              <span className="text-xs font-mono text-muted-foreground">
                {outputDimensions.width} × {outputDimensions.height} px
                {outputBlob ? ` (${formatBytes(outputBlob.size)})` : ""}
              </span>
            )}
          </div>
          <div className="aspect-square flex items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/40 p-2 relative">
            {outputUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={outputUrl} alt="Transformed" className="max-h-full max-w-full object-contain" />
            ) : (
              <RefreshCw className="size-5 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-3">
          {outputBlob && (
            <Button
              onClick={() => downloadBlob(outputBlob, `rotated-${file.name.replace(/\.[^/.]+$/, "")}.${format}`)}
            >
              <Download className="size-4 mr-2" /> Download Image
            </Button>
          )}
          <Button variant="ghost" onClick={resetAll}>
            <RotateCcw className="size-4 mr-2" /> Start Over
          </Button>
        </div>
      </div>
    </div>
  )
}
