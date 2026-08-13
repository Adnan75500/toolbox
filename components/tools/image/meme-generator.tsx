"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Type, Download, RotateCcw, Sparkles, Sliders } from "lucide-react"
import { toast } from "sonner"
import { FileDropzone } from "@/components/file-dropzone"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { downloadBlob } from "@/lib/download"
import { loadImage } from "@/lib/image"

const PRESET_MEMES = [
  { name: "Drake Hotline", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80" },
  { name: "Cute Cat", url: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop&q=80" },
  { name: "Surprised Dog", url: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&auto=format&fit=crop&q=80" },
]

export default function MemeGenerator() {
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [topText, setTopText] = useState("WHEN YOUR LOCAL WEB APP")
  const [bottomText, setBottomText] = useState("WORKS 100% IN THE BROWSER")
  const [fontSize, setFontSize] = useState(42)
  const [fontFamily, setFontFamily] = useState("Impact")
  const [fillColor, setFillColor] = useState("#FFFFFF")
  const [strokeColor, setStrokeColor] = useState("#000000")
  const [strokeWidth, setStrokeWidth] = useState(6)
  const [isUppercase, setIsUppercase] = useState(true)

  const [outputUrl, setOutputUrl] = useState<string | null>(null)
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null)

  function onFiles(files: File[]) {
    const f = files[0]
    if (!f.type.startsWith("image/")) {
      toast.error("Please choose a valid image file.")
      return
    }
    if (fileUrl && fileUrl.startsWith("blob:")) URL.revokeObjectURL(fileUrl)
    setFileUrl(URL.createObjectURL(f))
  }

  const renderMeme = useCallback(async () => {
    if (!fileUrl) return
    try {
      const img = await loadImage(fileUrl)
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Draw Base Image
      ctx.drawImage(img, 0, 0)

      // Configure Text Typography
      const finalTop = isUppercase ? topText.toUpperCase() : topText
      const finalBottom = isUppercase ? bottomText.toUpperCase() : bottomText

      ctx.textAlign = "center"
      ctx.fillStyle = fillColor
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = Math.round((fontSize / 40) * strokeWidth)
      ctx.font = `900 ${fontSize * (img.width / 800)}px ${fontFamily}, sans-serif`

      // Draw Top Text
      if (finalTop.trim()) {
        ctx.textBaseline = "top"
        const yPos = img.height * 0.04
        ctx.strokeText(finalTop, img.width / 2, yPos)
        ctx.fillText(finalTop, img.width / 2, yPos)
      }

      // Draw Bottom Text
      if (finalBottom.trim()) {
        ctx.textBaseline = "bottom"
        const yPos = img.height * 0.96
        ctx.strokeText(finalBottom, img.width / 2, yPos)
        ctx.fillText(finalBottom, img.width / 2, yPos)
      }

      canvas.toBlob((blob) => {
        if (!blob) return
        if (outputUrl) URL.revokeObjectURL(outputUrl)
        setOutputBlob(blob)
        setOutputUrl(URL.createObjectURL(blob))
      }, "image/png", 0.95)
    } catch {
      // Ignore rendering error
    }
  }, [fileUrl, topText, bottomText, fontSize, fontFamily, fillColor, strokeColor, strokeWidth, isUppercase, outputUrl])

  useEffect(() => {
    renderMeme()
  }, [renderMeme])

  function reset() {
    if (fileUrl && fileUrl.startsWith("blob:")) URL.revokeObjectURL(fileUrl)
    if (outputUrl) URL.revokeObjectURL(outputUrl)
    setFileUrl(null)
    setOutputUrl(null)
    setOutputBlob(null)
  }

  if (!fileUrl) {
    return (
      <div className="space-y-6">
        <FileDropzone
          accept="image/*"
          onFiles={onFiles}
          label="Drop an image to generate a meme"
          hint="JPG, PNG, WebP, GIF — Processed 100% locally in your browser"
        />

        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-1.5">
            <Sparkles className="size-4 text-primary" /> Or Pick a Starter Template:
          </Label>
          <div className="grid grid-cols-3 gap-4">
            {PRESET_MEMES.map((preset) => (
              <button
                key={preset.name}
                onClick={() => setFileUrl(preset.url)}
                className="group relative aspect-video rounded-xl overflow-hidden border border-border bg-card hover:border-primary transition-all text-left"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preset.url} alt={preset.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                <span className="absolute bottom-2 left-2 bg-black/70 text-white text-xs font-semibold px-2 py-1 rounded-md">
                  {preset.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Side: Customization Controls */}
        <div className="space-y-5 rounded-xl border border-border bg-card p-5">
          <div className="flex justify-between items-center border-b border-border pb-2">
            <span className="font-medium text-sm flex items-center gap-1.5">
              <Type className="size-4 text-primary" /> Meme Text Settings
            </span>
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw className="size-4 mr-1" /> Start Over
            </Button>
          </div>

          {/* Top Text Input */}
          <div className="space-y-1.5">
            <Label className="text-xs">Top Header Text</Label>
            <Input
              value={topText}
              onChange={(e) => setTopText(e.target.value)}
              placeholder="TOP TEXT..."
            />
          </div>

          {/* Bottom Text Input */}
          <div className="space-y-1.5">
            <Label className="text-xs">Bottom Footer Text</Label>
            <Input
              value={bottomText}
              onChange={(e) => setBottomText(e.target.value)}
              placeholder="BOTTOM TEXT..."
            />
          </div>

          {/* Font Family Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Font Family</Label>
              <Select value={fontFamily} onValueChange={(v: any) => v && setFontFamily(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Impact">Impact (Classic)</SelectItem>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Trebuchet MS">Trebuchet</SelectItem>
                  <SelectItem value="Comic Sans MS">Comic Sans</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Case Style</Label>
              <Button
                variant={isUppercase ? "default" : "outline"}
                className="w-full justify-center text-xs"
                onClick={() => setIsUppercase(!isUppercase)}
              >
                {isUppercase ? "UPPERCASE" : "Normal Case"}
              </Button>
            </div>
          </div>

          {/* Font Size Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span>Font Size</span>
              <span className="font-mono">{fontSize}px</span>
            </div>
            <Slider value={[fontSize]} min={20} max={90} step={2} onValueChange={(v) => setFontSize(v[0])} />
          </div>

          {/* Color Fill & Stroke Picker */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
            <div className="space-y-1.5">
              <Label className="text-xs">Text Fill Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={fillColor}
                  onChange={(e) => setFillColor(e.target.value)}
                  className="size-8 rounded border border-border cursor-pointer"
                />
                <span className="font-mono text-xs">{fillColor}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Outline Stroke</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={strokeColor}
                  onChange={(e) => setStrokeColor(e.target.value)}
                  className="size-8 rounded border border-border cursor-pointer"
                />
                <span className="font-mono text-xs">{strokeColor}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Live Canvas Preview & Download */}
        <div className="space-y-4">
          <div className="aspect-square flex items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/30 p-2">
            {outputUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={outputUrl} alt="Meme Preview" className="max-h-full max-w-full object-contain rounded-lg shadow-sm" />
            ) : (
              <span className="text-xs text-muted-foreground">Rendering meme...</span>
            )}
          </div>

          {outputBlob && (
            <Button className="w-full" onClick={() => downloadBlob(outputBlob, "custom-meme.png")}>
              <Download className="size-4 mr-2" /> Download High-Res Meme
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
