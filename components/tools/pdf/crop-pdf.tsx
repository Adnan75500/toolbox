"use client"

import { useState } from "react"
import { PDFDocument } from "pdf-lib"
import { FileText, Crop, RotateCcw, Download, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { FileDropzone } from "@/components/file-dropzone"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { downloadBlob, formatBytes } from "@/lib/download"

export default function CropPdf() {
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState<number>(0)
  const [cropTop, setCropTop] = useState<number>(20)
  const [cropBottom, setCropBottom] = useState<number>(20)
  const [cropLeft, setCropLeft] = useState<number>(20)
  const [cropRight, setCropRight] = useState<number>(20)
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
      toast.error("Failed to load PDF file.")
    }
  }

  async function processCrop() {
    if (!file || pageCount === 0) return
    setLoading(true)
    try {
      const buffer = await file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
      const pages = pdfDoc.getPages()

      pages.forEach((page) => {
        const { width, height } = page.getSize()
        const newX = cropLeft
        const newY = cropBottom
        const newWidth = Math.max(10, width - cropLeft - cropRight)
        const newHeight = Math.max(10, height - cropTop - cropBottom)

        page.setCropBox(newX, newY, newWidth, newHeight)
      })

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes], { type: "application/pdf" })
      setOutputBlob(blob)
      toast.success("PDF margins cropped successfully!")
    } catch {
      toast.error("Failed to crop PDF document.")
    } finally {
      setLoading(false)
    }
  }

  if (!file) {
    return (
      <FileDropzone
        accept=".pdf,application/pdf"
        onFiles={onFiles}
        label="Drop a PDF file to trim margins and crop pages"
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

      <div className="rounded-xl border border-border bg-card p-5 space-y-4 max-w-md">
        <div className="flex items-center gap-2 font-medium text-sm border-b border-border pb-2">
          <Crop className="size-4 text-primary" /> Margin Trim Controls (pt)
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs">Top Margin</Label>
            <Input
              type="number"
              value={cropTop}
              onChange={(e) => setCropTop(Number(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Bottom Margin</Label>
            <Input
              type="number"
              value={cropBottom}
              onChange={(e) => setCropBottom(Number(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Left Margin</Label>
            <Input
              type="number"
              value={cropLeft}
              onChange={(e) => setCropLeft(Number(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Right Margin</Label>
            <Input
              type="number"
              value={cropRight}
              onChange={(e) => setCropRight(Number(e.target.value) || 0)}
            />
          </div>
        </div>

        <Button onClick={processCrop} disabled={loading} className="w-full">
          {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
          Crop PDF Margins
        </Button>
      </div>

      {outputBlob && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            Cropped PDF Ready ({formatBytes(outputBlob.size)})
          </span>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => downloadBlob(outputBlob, `cropped-${file.name}`)}
          >
            <Download className="size-4 mr-2" /> Download Cropped PDF
          </Button>
        </div>
      )}
    </div>
  )
}
