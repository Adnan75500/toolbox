"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Pipette, Copy, Check, Palette, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { FileDropzone } from "@/components/file-dropzone"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { loadImage } from "@/lib/image"

interface ColorResult {
  hex: string
  rgb: string
  hsl: string
  hsv: string
  cmyk: string
  r: number
  g: number
  b: number
}

export default function ColorPicker() {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [activeColor, setActiveColor] = useState<ColorResult | null>(null)
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null)
  const [dominantPalette, setDominantPalette] = useState<string[]>([])
  const [colorHistory, setColorHistory] = useState<string[]>([])
  const [magnifier, setMagnifier] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false })

  const containerRef = useRef<HTMLDivElement | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const hiddenCanvasRef = useRef<HTMLCanvasElement | null>(null)

  function reset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(null)
    setPreviewUrl(null)
    setActiveColor(null)
    setDominantPalette([])
    setColorHistory([])
  }

  const extractPalette = useCallback(async (url: string) => {
    try {
      const img = await loadImage(url)
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      canvas.width = 100
      canvas.height = 100
      ctx.drawImage(img, 0, 0, 100, 100)
      const imageData = ctx.getImageData(0, 0, 100, 100).data

      const colorCounts: Record<string, number> = {}
      for (let i = 0; i < imageData.length; i += 16) {
        const r = Math.round(imageData[i] / 32) * 32
        const g = Math.round(imageData[i + 1] / 32) * 32
        const b = Math.round(imageData[i + 2] / 32) * 32
        const a = imageData[i + 3]
        if (a < 128) continue
        const hex = rgbToHex(r, g, b)
        colorCounts[hex] = (colorCounts[hex] || 0) + 1
      }

      const sorted = Object.keys(colorCounts).sort((a, b) => colorCounts[b] - colorCounts[a])
      setDominantPalette(sorted.slice(0, 8))
    } catch {
      // Ignore palette extraction error
    }
  }, [])

  function onFiles(files: File[]) {
    const f = files[0]
    if (!f.type.startsWith("image/")) {
      toast.error("Please select a valid image file.")
      return
    }
    reset()
    setFile(f)
    const url = URL.createObjectURL(f)
    setPreviewUrl(url)
    extractPalette(url)
  }

  function pickColorFromCoords(clientX: number, clientY: number) {
    if (!imageRef.current || !previewUrl) return
    const img = imageRef.current
    const rect = img.getBoundingClientRect()
    const x = Math.floor(((clientX - rect.left) / rect.width) * img.naturalWidth)
    const y = Math.floor(((clientY - rect.top) / rect.height) * img.naturalHeight)

    if (x < 0 || y < 0 || x >= img.naturalWidth || y >= img.naturalHeight) return

    const canvas = hiddenCanvasRef.current || document.createElement("canvas")
    hiddenCanvasRef.current = canvas
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.drawImage(img, 0, 0)
    const pixel = ctx.getImageData(x, y, 1, 1).data
    const r = pixel[0]
    const g = pixel[1]
    const b = pixel[2]
    selectRgbColor(r, g, b)
  }

  function selectRgbColor(r: number, g: number, b: number) {
    const hex = rgbToHex(r, g, b)
    const result: ColorResult = {
      r,
      g,
      b,
      hex,
      rgb: `rgb(${r}, ${g}, ${b})`,
      hsl: rgbToHsl(r, g, b),
      hsv: rgbToHsv(r, g, b),
      cmyk: rgbToCmyk(r, g, b),
    }
    setActiveColor(result)
    setColorHistory((prev) => Array.from(new Set([hex, ...prev])).slice(0, 10))
  }

  async function useNativeEyeDropper() {
    if (typeof window !== "undefined" && "EyeDropper" in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper()
        const result = await eyeDropper.open()
        const hex = result.sRGBHex
        const rgb = hexToRgb(hex)
        if (rgb) selectRgbColor(rgb.r, rgb.g, rgb.b)
      } catch {
        // User canceled eyedropper
      }
    } else {
      toast.info("Native EyeDropper API is not supported in this browser. Click directly on the image preview.")
    }
  }

  function copyValue(text: string, format: string) {
    navigator.clipboard.writeText(text)
    setCopiedFormat(format)
    toast.success(`Copied ${format}: ${text}`)
    setTimeout(() => setCopiedFormat(null), 2000)
  }

  if (!file) {
    return (
      <FileDropzone
        accept="image/*"
        onFiles={onFiles}
        label="Drop an image to pick colors & extract palette"
        hint="JPG, PNG, WebP, SVG — Processed 100% locally on your device"
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-5">
        <div>
          <h3 className="font-semibold text-sm">{file.name}</h3>
          <p className="text-xs text-muted-foreground">Click anywhere on the photo to pick exact pixel color</p>
        </div>
        <div className="flex items-center gap-2">
          {typeof window !== "undefined" && "EyeDropper" in window && (
            <Button size="sm" onClick={useNativeEyeDropper}>
              <Pipette className="size-4 mr-1.5" /> Native Eyedropper
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={reset}>
            <RotateCcw className="size-4 mr-1.5" /> Start Over
          </Button>
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Image Canvas Container */}
        <div className="space-y-4">
          <div
            ref={containerRef}
            className="relative aspect-video flex items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/40 cursor-crosshair"
            onClick={(e) => pickColorFromCoords(e.clientX, e.clientY)}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              setMagnifier({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
                visible: true,
              })
            }}
            onMouseLeave={() => setMagnifier((prev) => ({ ...prev, visible: false }))}
          >
            {previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                ref={imageRef}
                src={previewUrl}
                alt="Picker target"
                className="max-h-full max-w-full object-contain pointer-events-none select-none"
              />
            )}
          </div>

          {/* Dominant Palette Swatches */}
          {dominantPalette.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Palette className="size-3.5" /> Dominant Colors Extracted
              </Label>
              <div className="flex flex-wrap gap-2">
                {dominantPalette.map((hex) => (
                  <button
                    key={hex}
                    className="size-8 rounded-lg border border-border/80 shadow-sm transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary"
                    style={{ backgroundColor: hex }}
                    title={`Select ${hex}`}
                    onClick={() => {
                      const rgb = hexToRgb(hex)
                      if (rgb) selectRgbColor(rgb.r, rgb.g, rgb.b)
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Color History */}
          {colorHistory.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">Recently Picked</Label>
              <div className="flex flex-wrap gap-2">
                {colorHistory.map((hex) => (
                  <button
                    key={hex}
                    className="size-7 rounded-full border border-border shadow-xs hover:scale-110 transition-transform"
                    style={{ backgroundColor: hex }}
                    title={hex}
                    onClick={() => {
                      const rgb = hexToRgb(hex)
                      if (rgb) selectRgbColor(rgb.r, rgb.g, rgb.b)
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Selected Color Inspector Side */}
        <div className="space-y-4">
          {activeColor ? (
            <div className="rounded-xl border border-border bg-card p-5 space-y-5">
              {/* Color Box Header */}
              <div className="flex items-center gap-4">
                <div
                  className="size-16 rounded-xl border border-border shadow-md"
                  style={{ backgroundColor: activeColor.hex }}
                />
                <div>
                  <h4 className="font-mono text-2xl font-bold">{activeColor.hex}</h4>
                  <p className="text-xs text-muted-foreground font-mono">{activeColor.rgb}</p>
                </div>
              </div>

              {/* Formats Copy List */}
              <div className="space-y-3">
                <ColorFormatRow label="HEX" value={activeColor.hex} copied={copiedFormat === "HEX"} onCopy={() => copyValue(activeColor.hex, "HEX")} />
                <ColorFormatRow label="RGB" value={activeColor.rgb} copied={copiedFormat === "RGB"} onCopy={() => copyValue(activeColor.rgb, "RGB")} />
                <ColorFormatRow label="HSL" value={activeColor.hsl} copied={copiedFormat === "HSL"} onCopy={() => copyValue(activeColor.hsl, "HSL")} />
                <ColorFormatRow label="HSV" value={activeColor.hsv} copied={copiedFormat === "HSV"} onCopy={() => copyValue(activeColor.hsv, "HSV")} />
                <ColorFormatRow label="CMYK" value={activeColor.cmyk} copied={copiedFormat === "CMYK"} onCopy={() => copyValue(activeColor.cmyk, "CMYK")} />
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-60 flex-col items-center justify-center rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">
              <Pipette className="size-8 mb-2 text-primary/60" />
              <p className="text-sm font-medium">Click on the image to inspect pixel color</p>
              <p className="text-xs">Supports HEX, RGB, HSL, HSV, CMYK output</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ColorFormatRow({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string
  value: string
  copied: boolean
  onCopy: () => void
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs">
      <span className="font-medium text-muted-foreground w-12">{label}</span>
      <span className="font-mono font-semibold text-foreground flex-1 text-center truncate px-2">{value}</span>
      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onCopy}>
        {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
      </Button>
    </div>
  )
}

// Helpers
function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("").toUpperCase()
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

function rgbToHsl(r: number, g: number, b: number): string {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }
  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`
}

function rgbToHsv(r: number, g: number, b: number): string {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  const s = max === 0 ? 0 : d / max
  const v = max
  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }
  return `hsv(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(v * 100)}%)`
}

function rgbToCmyk(r: number, g: number, b: number): string {
  let c = 1 - r / 255
  let m = 1 - g / 255
  let y = 1 - b / 255
  const k = Math.min(c, m, y)
  if (k === 1) return `cmyk(0%, 0%, 0%, 100%)`
  c = Math.round(((c - k) / (1 - k)) * 100)
  m = Math.round(((m - k) / (1 - k)) * 100)
  y = Math.round(((y - k) / (1 - k)) * 100)
  const kP = Math.round(k * 100)
  return `cmyk(${c}%, ${m}%, ${y}%, ${kP}%)`
}
