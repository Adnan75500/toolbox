"use client"

import { Download, Loader2, RotateCcw } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { FileDropzone } from "@/components/file-dropzone"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { downloadBlob } from "@/lib/download"
import { canvasToBlob, loadImage, readFileAsDataURL } from "@/lib/image"

type Position = "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right" | "tiled"

const POSITIONS: { label: string; value: Position }[] = [
  { label: "Center", value: "center" },
  { label: "Top left", value: "top-left" },
  { label: "Top right", value: "top-right" },
  { label: "Bottom left", value: "bottom-left" },
  { label: "Bottom right", value: "bottom-right" },
  { label: "Tiled", value: "tiled" },
]

export default function WatermarkAdder() {
  const [file, setFile] = useState<File | null>(null)
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [text, setText] = useState("© Your Name")
  const [fontSize, setFontSize] = useState(6)
  const [opacity, setOpacity] = useState(50)
  const [color, setColor] = useState("#ffffff")
  const [position, setPosition] = useState<Position>("bottom-right")
  const [busy, setBusy] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  function reset() {
    setFile(null)
    setImg(null)
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

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !img) return
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0)

    const px = Math.max(12, Math.round((fontSize / 100) * canvas.width))
    ctx.font = `600 ${px}px ui-sans-serif, system-ui, sans-serif`
    ctx.fillStyle = color
    ctx.globalAlpha = opacity / 100
    ctx.textBaseline = "middle"

    const pad = px * 0.8

    if (position === "tiled") {
      ctx.textAlign = "left"
      const stepX = ctx.measureText(text).width + px * 3
      const stepY = px * 4
      ctx.save()
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate(-Math.PI / 6)
      ctx.translate(-canvas.width, -canvas.height)
      for (let y = 0; y < canvas.height * 2; y += stepY) {
        for (let x = 0; x < canvas.width * 2; x += stepX) {
          ctx.fillText(text, x, y)
        }
      }
      ctx.restore()
    } else {
      let x = canvas.width / 2
      let y = canvas.height / 2
      ctx.textAlign = "center"
      const metrics = ctx.measureText(text)
      const half = metrics.width / 2
      if (position.includes("left")) {
        ctx.textAlign = "left"
        x = pad
      }
      if (position.includes("right")) {
        ctx.textAlign = "right"
        x = canvas.width - pad
      }
      if (position === "center") {
        ctx.textAlign = "center"
        x = canvas.width / 2
      }
      if (position.includes("top")) y = pad + px / 2
      if (position.includes("bottom")) y = canvas.height - pad - px / 2
      void half
      ctx.fillText(text, x, y)
    }
    ctx.globalAlpha = 1
  }, [img, text, fontSize, opacity, color, position])

  async function download() {
    const canvas = canvasRef.current
    if (!canvas || !file) return
    setBusy(true)
    try {
      const type = file.type === "image/png" ? "image/png" : "image/jpeg"
      const blob = await canvasToBlob(canvas, type, 0.92)
      downloadBlob(blob, `watermarked-${file.name}`)
      toast.success("Watermarked image downloaded")
    } catch {
      toast.error("Could not export the image.")
    } finally {
      setBusy(false)
    }
  }

  if (!file || !img) {
    return (
      <FileDropzone
        accept="image/*"
        onFiles={onFiles}
        label="Drop an image to watermark"
        hint="Add a text watermark, processed locally"
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex max-h-96 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/40 p-2">
        <canvas ref={canvasRef} className="max-h-80 max-w-full object-contain" />
      </div>

      <div className="grid gap-5 rounded-xl border border-border bg-card p-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="wm-text">Watermark text</Label>
          <Input
            id="wm-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="mt-1.5"
            placeholder="© Your Name"
          />
        </div>
        <div>
          <Label className="mb-1.5 block">Position</Label>
          <Select value={position} onValueChange={(v) => setPosition(v as Position)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {POSITIONS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="wm-color" className="mb-1.5 block">
            Color
          </Label>
          <div className="flex items-center gap-2">
            <input
              id="wm-color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 w-12 cursor-pointer rounded-md border border-border bg-transparent"
            />
            <Input value={color} onChange={(e) => setColor(e.target.value)} className="font-mono" />
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label>Size</Label>
            <span className="text-sm text-muted-foreground">{fontSize}%</span>
          </div>
          <Slider value={[fontSize]} min={2} max={20} step={0.5} onValueChange={(v) => setFontSize(v[0])} />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label>Opacity</Label>
            <span className="text-sm text-muted-foreground">{opacity}%</span>
          </div>
          <Slider value={[opacity]} min={5} max={100} step={1} onValueChange={(v) => setOpacity(v[0])} />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={download} disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          Download watermarked
        </Button>
        <Button variant="ghost" onClick={reset}>
          <RotateCcw className="size-4" />
          Start over
        </Button>
      </div>
    </div>
  )
}
