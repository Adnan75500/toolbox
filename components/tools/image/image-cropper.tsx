"use client"

import Cropper, { type Area } from "react-easy-crop"
import { Download, Loader2, RotateCcw } from "lucide-react"
import { useCallback, useState } from "react"
import { toast } from "sonner"
import { FileDropzone } from "@/components/file-dropzone"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { downloadBlob } from "@/lib/download"
import { canvasToBlob, loadImage, readFileAsDataURL } from "@/lib/image"

const ASPECTS: { label: string; value: number | undefined }[] = [
  { label: "Free", value: undefined },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "16:9", value: 16 / 9 },
  { label: "3:4", value: 3 / 4 },
]

export default function ImageCropper() {
  const [file, setFile] = useState<File | null>(null)
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [aspect, setAspect] = useState<number | undefined>(undefined)
  const [pixels, setPixels] = useState<Area | null>(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null)

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setPixels(areaPixels)
  }, [])

  function reset() {
    if (result) URL.revokeObjectURL(result.url)
    setFile(null)
    setImageSrc(null)
    setResult(null)
    setZoom(1)
    setCrop({ x: 0, y: 0 })
  }

  async function onFiles(files: File[]) {
    const f = files[0]
    if (!f.type.startsWith("image/")) {
      toast.error("Please choose an image file.")
      return
    }
    reset()
    const dataUrl = await readFileAsDataURL(f)
    setFile(f)
    setImageSrc(dataUrl)
  }

  async function cropImage() {
    if (!imageSrc || !pixels) return
    setBusy(true)
    setResult(null)
    try {
      const img = await loadImage(imageSrc)
      const canvas = document.createElement("canvas")
      canvas.width = Math.round(pixels.width)
      canvas.height = Math.round(pixels.height)
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("no ctx")
      ctx.drawImage(
        img,
        pixels.x,
        pixels.y,
        pixels.width,
        pixels.height,
        0,
        0,
        pixels.width,
        pixels.height,
      )
      const type = file?.type === "image/png" ? "image/png" : "image/jpeg"
      const blob = await canvasToBlob(canvas, type, 0.92)
      setResult({ blob, url: URL.createObjectURL(blob) })
      toast.success("Image cropped")
    } catch (err) {
      console.log("[v0] crop error:", err)
      toast.error("Could not crop this image.")
    } finally {
      setBusy(false)
    }
  }

  if (!file || !imageSrc) {
    return (
      <FileDropzone
        accept="image/*"
        onFiles={onFiles}
        label="Drop an image to crop"
        hint="Drag and zoom to frame your crop"
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="relative h-80 w-full overflow-hidden rounded-xl border border-border bg-muted/40">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      <div className="space-y-5 rounded-xl border border-border bg-card p-5">
        <div>
          <Label className="mb-2 block">Aspect ratio</Label>
          <div className="flex flex-wrap gap-2">
            {ASPECTS.map((a) => (
              <Button
                key={a.label}
                size="sm"
                variant={aspect === a.value ? "default" : "secondary"}
                onClick={() => setAspect(a.value)}
              >
                {a.label}
              </Button>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label>Zoom</Label>
            <span className="text-sm text-muted-foreground">{zoom.toFixed(1)}×</span>
          </div>
          <Slider value={[zoom]} min={1} max={4} step={0.1} onValueChange={(v) => setZoom(v[0])} />
        </div>
      </div>

      {result && (
        <div>
          <span className="text-sm font-medium">Result</span>
          <div className="mt-2 flex max-h-72 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/40 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={result.url || "/placeholder.svg"} alt="Cropped result" className="max-h-64 max-w-full object-contain" />
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Button onClick={cropImage} disabled={busy || !pixels}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          Crop image
        </Button>
        {result && (
          <Button variant="secondary" onClick={() => downloadBlob(result.blob, `cropped-${file.name}`)}>
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
