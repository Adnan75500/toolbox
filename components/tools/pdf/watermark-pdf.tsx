"use client"

import { useState } from "react"
import { PDFDocument, degrees, rgb, StandardFonts } from "pdf-lib"
import { FileText, Stamp, Download, RotateCcw, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { FileDropzone } from "@/components/file-dropzone"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { downloadBlob, formatBytes } from "@/lib/download"

export default function WatermarkPdf() {
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState<number>(0)
  const [watermarkText, setWatermarkText] = useState<string>("CONFIDENTIAL")
  const [fontSize, setFontSize] = useState<number>(48)
  const [opacity, setOpacity] = useState<number>(30) // percentage
  const [angle, setAngle] = useState<number>(45) // degrees
  const [color, setColor] = useState<string>("#ff0000")
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null)
  const [loading, setLoading] = useState(false)

  function reset() {
    setFile(null)
    setPageCount(0)
    setOutputBlob(null)
  }

  async function onFiles(files: File[]) {
    const f = files[0]
    if (f.type !== "application/pdf" && !f.name.endsWith(".pdf")) {
      toast.error("Please upload a valid PDF document.")
      return
    }
    try {
      const buffer = await f.arrayBuffer()
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
      setFile(f)
      setPageCount(pdfDoc.getPageCount())
      setOutputBlob(null)
    } catch {
      toast.error("Could not parse PDF file.")
    }
  }

  async function applyWatermark() {
    if (!file || pageCount === 0 || !watermarkText.trim()) return
    setLoading(true)
    try {
      const buffer = await file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
      const pages = pdfDoc.getPages()

      // Convert hex color to rgb floats 0-1
      const r = parseInt(color.slice(1, 3), 16) / 255
      const g = parseInt(color.slice(3, 5), 16) / 255
      const b = parseInt(color.slice(5, 7), 16) / 255

      pages.forEach((page) => {
        const { width, height } = page.getSize()
        const textWidth = font.widthOfTextAtSize(watermarkText, fontSize)
        const textHeight = font.heightAtSize(fontSize)

        page.drawText(watermarkText, {
          x: width / 2 - textWidth / 2,
          y: height / 2 - textHeight / 2,
          size: fontSize,
          font,
          color: rgb(r, g, b),
          opacity: opacity / 100,
          rotate: degrees(angle),
        })
      })

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes], { type: "application/pdf" })
      setOutputBlob(blob)
      toast.success("Watermark stamped on all PDF pages!")
    } catch {
      toast.error("Failed to add watermark to PDF.")
    } finally {
      setLoading(false)
    }
  }

  if (!file) {
    return (
      <FileDropzone
        accept=".pdf,application/pdf"
        onFiles={onFiles}
        label="Drop a PDF document to add a text watermark"
        hint="Processed 100% locally on your machine"
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText className="size-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{file.name}</h3>
            <p className="text-xs text-muted-foreground">
              {pageCount} total pages • {formatBytes(file.size)}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={reset}>
          <RotateCcw className="size-4 mr-1.5" /> Start Over
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-5 max-w-md">
        <div className="flex items-center gap-2 font-medium text-sm border-b border-border pb-2">
          <Stamp className="size-4 text-primary" /> Watermark Stamp Options
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Watermark Text</Label>
          <Input
            value={watermarkText}
            onChange={(e) => setWatermarkText(e.target.value)}
            placeholder="e.g. CONFIDENTIAL"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Font Size</Label>
            <Input
              type="number"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value) || 36)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="size-8 rounded border border-border cursor-pointer"
              />
              <span className="font-mono text-xs">{color}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-medium">
            <span>Opacity</span>
            <span className="font-mono">{opacity}%</span>
          </div>
          <Slider value={[opacity]} min={10} max={100} step={5} onValueChange={(v) => setOpacity(v[0])} />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-medium">
            <span>Rotation Angle</span>
            <span className="font-mono">{angle}°</span>
          </div>
          <Slider value={[angle]} min={-90} max={90} step={5} onValueChange={(v) => setAngle(v[0])} />
        </div>

        <Button onClick={applyWatermark} disabled={loading || !watermarkText.trim()} className="w-full">
          {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
          Apply Watermark
        </Button>
      </div>

      {outputBlob && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            Watermarked PDF Ready ({formatBytes(outputBlob.size)})
          </span>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => downloadBlob(outputBlob, `watermarked-${file.name}`)}
          >
            <Download className="size-4 mr-2" /> Download Watermarked PDF
          </Button>
        </div>
      )}
    </div>
  )
}
