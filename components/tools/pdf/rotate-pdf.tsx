"use client"

import { useState } from "react"
import { PDFDocument, degrees } from "pdf-lib"
import { FileText, RotateCcw, RotateCw, Download, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { FileDropzone } from "@/components/file-dropzone"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { downloadBlob, formatBytes } from "@/lib/download"

export default function RotatePdf() {
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState<number>(0)
  const [rotationAngle, setRotationAngle] = useState<90 | 180 | 270>(90)
  const [targetScope, setTargetScope] = useState<"all" | "range">("all")
  const [rangeStr, setRangeStr] = useState<string>("1")
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
      toast.error("Please upload a valid PDF file.")
      return
    }
    try {
      const buffer = await f.arrayBuffer()
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
      setFile(f)
      setPageCount(pdfDoc.getPageCount())
      setOutputBlob(null)
    } catch {
      toast.error("Could not parse PDF document.")
    }
  }

  async function processRotation() {
    if (!file || pageCount === 0) return
    setLoading(true)
    try {
      const buffer = await file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
      const pdfPages = pdfDoc.getPages()

      const targetIndices =
        targetScope === "all"
          ? pdfPages.map((_, i) => i)
          : parsePageRange(rangeStr, pageCount).map((p) => p - 1)

      targetIndices.forEach((idx) => {
        const page = pdfPages[idx]
        if (page) {
          const currentRotation = page.getRotation().angle
          page.setRotation(degrees((currentRotation + rotationAngle) % 360))
        }
      })

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes], { type: "application/pdf" })
      setOutputBlob(blob)
      toast.success("PDF pages rotated successfully!")
    } catch {
      toast.error("Failed to rotate PDF pages.")
    } finally {
      setLoading(false)
    }
  }

  if (!file) {
    return (
      <FileDropzone
        accept=".pdf,application/pdf"
        onFiles={onFiles}
        label="Drop a PDF file to rotate pages"
        hint="Processed 100% locally on your device"
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
        <div className="space-y-1.5">
          <Label className="text-xs">Rotation Angle</Label>
          <div className="flex items-center gap-2">
            <Button
              variant={rotationAngle === 90 ? "default" : "outline"}
              size="sm"
              onClick={() => setRotationAngle(90)}
              className="flex-1"
            >
              <RotateCw className="size-3.5 mr-1" /> +90° Clockwise
            </Button>
            <Button
              variant={rotationAngle === 180 ? "default" : "outline"}
              size="sm"
              onClick={() => setRotationAngle(180)}
              className="flex-1"
            >
              180° Flip
            </Button>
            <Button
              variant={rotationAngle === 270 ? "default" : "outline"}
              size="sm"
              onClick={() => setRotationAngle(270)}
              className="flex-1"
            >
              <RotateCcw className="size-3.5 mr-1" /> 270° Counter-CW
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Apply To</Label>
          <Select value={targetScope} onValueChange={(v: any) => setTargetScope(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pages ({pageCount} pages)</SelectItem>
              <SelectItem value="range">Specific Page Range</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {targetScope === "range" && (
          <div className="space-y-1.5">
            <Label className="text-xs">Page Numbers (e.g. 1, 3-5)</Label>
            <Input
              value={rangeStr}
              onChange={(e) => setRangeStr(e.target.value)}
              placeholder="e.g. 1-3, 5"
            />
          </div>
        )}

        <Button onClick={processRotation} disabled={loading} className="w-full">
          {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
          Rotate PDF Pages
        </Button>
      </div>

      {outputBlob && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            Rotated PDF Ready ({formatBytes(outputBlob.size)})
          </span>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => downloadBlob(outputBlob, `rotated-${file.name}`)}
          >
            <Download className="size-4 mr-2" /> Download Rotated PDF
          </Button>
        </div>
      )}
    </div>
  )
}

function parsePageRange(rangeStr: string, maxPage: number): number[] {
  const pages = new Set<number>()
  const parts = rangeStr.split(",")
  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed) continue
    if (trimmed.includes("-")) {
      const [startStr, endStr] = trimmed.split("-")
      const start = parseInt(startStr, 10)
      const end = parseInt(endStr, 10)
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = Math.max(1, start); i <= Math.min(maxPage, end); i++) {
          pages.add(i)
        }
      }
    } else {
      const p = parseInt(trimmed, 10)
      if (!isNaN(p) && p >= 1 && p <= maxPage) {
        pages.add(p)
      }
    }
  }
  return Array.from(pages).sort((a, b) => a - b)
}
