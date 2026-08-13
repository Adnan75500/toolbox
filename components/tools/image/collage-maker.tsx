"use client"

import { useState, useEffect, useCallback } from "react"
import { LayoutGrid, Download, Plus, Trash2, RotateCcw, Sliders } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { downloadBlob } from "@/lib/download"
import { loadImage } from "@/lib/image"

interface CollageItem {
  id: string
  file: File
  url: string
}

export default function CollageMaker() {
  const [items, setItems] = useState<CollageItem[]>([])
  const [layout, setLayout] = useState<"2-side" | "2-stacked" | "3-header" | "4-grid" | "6-grid">("4-grid")
  const [gap, setGap] = useState<number>(12)
  const [radius, setRadius] = useState<number>(8)
  const [bgColor, setBgColor] = useState<string>("#ffffff")
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "4:3" | "16:9" | "9:16">("1:1")
  const [outputUrl, setOutputUrl] = useState<string | null>(null)
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null)

  function addFiles(files: FileList | File[]) {
    const newItems: CollageItem[] = []
    Array.from(files).forEach((f) => {
      if (f.type.startsWith("image/")) {
        newItems.push({
          id: Math.random().toString(36).substring(2, 9),
          file: f,
          url: URL.createObjectURL(f),
        })
      }
    })
    setItems((prev) => [...prev, ...newItems].slice(0, 6))
  }

  function removeItem(id: string) {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id)
      if (target) URL.revokeObjectURL(target.url)
      return prev.filter((i) => i.id !== id)
    })
  }

  function resetAll() {
    items.forEach((i) => URL.revokeObjectURL(i.url))
    if (outputUrl) URL.revokeObjectURL(outputUrl)
    setItems([])
    setOutputUrl(null)
    setOutputBlob(null)
  }

  const generateCollage = useCallback(async () => {
    if (items.length === 0) {
      setOutputUrl(null)
      setOutputBlob(null)
      return
    }

    // Determine target canvas dimensions based on aspect ratio
    let baseW = 1200
    let baseH = 1200
    if (aspectRatio === "4:3") baseH = 900
    else if (aspectRatio === "16:9") baseH = 675
    else if (aspectRatio === "9:16") baseW = 675

    const canvas = document.createElement("canvas")
    canvas.width = baseW
    canvas.height = baseH
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Fill background
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, baseW, baseH)

    // Load images
    const loadedImgs = await Promise.all(items.map((i) => loadImage(i.url).catch(() => null)))
    const validImgs = loadedImgs.filter((img): img is HTMLImageElement => img !== null)

    if (validImgs.length === 0) return

    // Calculate grid layout slots
    const slots = getLayoutSlots(layout, validImgs.length, baseW, baseH, gap)

    // Draw images inside rounded slots
    slots.forEach((slot, index) => {
      const img = validImgs[index]
      if (!img) return

      ctx.save()
      // Draw rounded rectangle clip path
      ctx.beginPath()
      ctx.roundRect(slot.x, slot.y, slot.w, slot.h, radius)
      ctx.clip()

      // Cover crop draw image inside slot
      const imgAspect = img.width / img.height
      const slotAspect = slot.w / slot.h
      let drawW = slot.w
      let drawH = slot.h
      let offsetX = 0
      let offsetY = 0

      if (imgAspect > slotAspect) {
        drawW = slot.h * imgAspect
        offsetX = (slot.w - drawW) / 2
      } else {
        drawH = slot.w / imgAspect
        offsetY = (slot.h - drawH) / 2
      }

      ctx.drawImage(img, slot.x + offsetX, slot.y + offsetY, drawW, drawH)
      ctx.restore()
    })

    canvas.toBlob((blob) => {
      if (!blob) return
      if (outputUrl) URL.revokeObjectURL(outputUrl)
      setOutputBlob(blob)
      setOutputUrl(URL.createObjectURL(blob))
    }, "image/png", 0.95)
  }, [items, layout, gap, radius, bgColor, aspectRatio, outputUrl])

  useEffect(() => {
    generateCollage()
  }, [generateCollage])

  return (
    <div className="space-y-6">
      {/* Upload Drop Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-5">
        <div>
          <h3 className="font-semibold text-sm">Collage Photo Gallery ({items.length}/6 images)</h3>
          <p className="text-xs text-muted-foreground">Upload 2 to 6 images to compose a customized photo grid</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
            <span className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors">
              <Plus className="size-4 mr-1.5" /> Add Images
            </span>
          </label>
          <Button size="sm" variant="ghost" onClick={resetAll} disabled={items.length === 0}>
            <RotateCcw className="size-4 mr-1.5" /> Reset
          </Button>
        </div>
      </div>

      {items.length > 0 && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Controls Settings Side */}
          <div className="space-y-5 rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 font-medium text-sm border-b border-border pb-2">
              <Sliders className="size-4 text-primary" /> Collage Settings
            </div>

            {/* Layout Preset */}
            <div className="space-y-1.5">
              <Label className="text-xs">Layout Style:</Label>
              <Select value={layout} onValueChange={(v: any) => setLayout(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4-grid">2 × 2 Quad Grid</SelectItem>
                  <SelectItem value="2-side">Side-by-Side (Horizontal)</SelectItem>
                  <SelectItem value="2-stacked">Stacked (Vertical)</SelectItem>
                  <SelectItem value="3-header">1 Hero Top + 2 Bottom</SelectItem>
                  <SelectItem value="6-grid">3 × 2 Mosaic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Aspect Ratio */}
            <div className="space-y-1.5">
              <Label className="text-xs">Aspect Ratio:</Label>
              <Select value={aspectRatio} onValueChange={(v: any) => setAspectRatio(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1:1">1:1 Square (Instagram)</SelectItem>
                  <SelectItem value="4:3">4:3 Standard Photo</SelectItem>
                  <SelectItem value="16:9">16:9 Widescreen</SelectItem>
                  <SelectItem value="9:16">9:16 Vertical Story</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Gap Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Spacing / Gap</span>
                <span className="font-mono">{gap}px</span>
              </div>
              <Slider value={[gap]} min={0} max={40} step={2} onValueChange={(v) => setGap(v[0])} />
            </div>

            {/* Corner Radius Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Border Corner Radius</span>
                <span className="font-mono">{radius}px</span>
              </div>
              <Slider value={[radius]} min={0} max={30} step={2} onValueChange={(v) => setRadius(v[0])} />
            </div>

            {/* Background Color */}
            <div className="space-y-1.5">
              <Label className="text-xs">Canvas Background:</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="size-8 rounded border border-border cursor-pointer"
                />
                <span className="font-mono text-xs">{bgColor}</span>
              </div>
            </div>

            {/* Items List Thumbnails */}
            <div className="space-y-2 pt-2 border-t border-border">
              <Label className="text-xs font-medium">Uploaded Images ({items.length})</Label>
              <div className="grid grid-cols-3 gap-2">
                {items.map((item) => (
                  <div key={item.id} className="relative group aspect-square rounded-md overflow-hidden border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.url} alt="Thumb" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeItem(item.id)}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Collage Output Preview */}
          <div className="md:col-span-2 space-y-4">
            <div className="aspect-square flex items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/30 p-3">
              {outputUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={outputUrl} alt="Collage" className="max-h-full max-w-full object-contain rounded-lg shadow-sm" />
              ) : (
                <div className="text-center text-muted-foreground text-sm">Generating collage preview...</div>
              )}
            </div>

            {outputBlob && (
              <Button className="w-full" onClick={() => downloadBlob(outputBlob, "photo-collage.png")}>
                <Download className="size-4 mr-2" /> Download High-Res Collage
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function getLayoutSlots(
  layout: string,
  count: number,
  canvasW: number,
  canvasH: number,
  gap: number
): Array<{ x: number; y: number; w: number; h: number }> {
  const slots: Array<{ x: number; y: number; w: number; h: number }> = []

  if (layout === "2-side" || count === 2) {
    const w = (canvasW - gap * 3) / 2
    const h = canvasH - gap * 2
    slots.push({ x: gap, y: gap, w, h })
    slots.push({ x: gap * 2 + w, y: gap, w, h })
  } else if (layout === "2-stacked") {
    const w = canvasW - gap * 2
    const h = (canvasH - gap * 3) / 2
    slots.push({ x: gap, y: gap, w, h })
    slots.push({ x: gap, y: gap * 2 + h, w, h })
  } else if (layout === "3-header") {
    const topH = (canvasH - gap * 3) * 0.6
    const botH = (canvasH - gap * 3) * 0.4
    const botW = (canvasW - gap * 3) / 2
    slots.push({ x: gap, y: gap, w: canvasW - gap * 2, h: topH })
    slots.push({ x: gap, y: gap * 2 + topH, w: botW, h: botH })
    slots.push({ x: gap * 2 + botW, y: gap * 2 + topH, w: botW, h: botH })
  } else if (layout === "6-grid" || count > 4) {
    const w = (canvasW - gap * 4) / 3
    const h = (canvasH - gap * 3) / 2
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 3; c++) {
        slots.push({ x: gap + c * (w + gap), y: gap + r * (h + gap), w, h })
      }
    }
  } else {
    // 4 Quad Grid default
    const w = (canvasW - gap * 3) / 2
    const h = (canvasH - gap * 3) / 2
    slots.push({ x: gap, y: gap, w, h })
    slots.push({ x: gap * 2 + w, y: gap, w, h })
    slots.push({ x: gap, y: gap * 2 + h, w, h })
    slots.push({ x: gap * 2 + w, y: gap * 2 + h, w, h })
  }

  return slots
}
