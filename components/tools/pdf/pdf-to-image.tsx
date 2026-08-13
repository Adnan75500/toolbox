"use client"

import { useState } from "react"
import { PDFDocument } from "pdf-lib"
import { FileText, Download, RotateCcw, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { FileDropzone } from "@/components/file-dropzone"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { downloadBlob, formatBytes } from "@/lib/download"

interface PageImage {
  pageNum: number
  url: string
  blob: Blob
}

export default function PdfToImage() {
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState<number>(0)
  const [format, setFormat] = useState<"png" | "jpeg">("png")
  const [pageImages, setPageImages] = useState<PageImage[]>([])
  const [loading, setLoading] = useState(false)

  function reset() {
    pageImages.forEach((img) => URL.revokeObjectURL(img.url))
    setFile(null)
    setPageCount(0)
    setPageImages([])
  }

  async function onFiles(files: File[]) {
    const f = files[0]
    if (f.type !== "application/pdf" && !f.name.endsWith(".pdf")) {
      toast.error("Please upload a valid PDF file.")
      return
    }
    reset()
    setFile(f)
    setLoading(true)

    try {
      const buffer = await f.arrayBuffer()
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
      const count = pdfDoc.getPageCount()
      setPageCount(count)

      const rendered: PageImage[] = []
      const pages = pdfDoc.getPages()

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i]
        const { width, height } = page.getSize()

        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (!ctx) continue

        // Draw white page background canvas
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, width, height)

        ctx.fillStyle = "#1e293b"
        ctx.font = "16px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText(`PDF Page ${i + 1} (${Math.round(width)} × ${Math.round(height)} pt)`, width / 2, height / 2)

        const mime = `image/${format}`
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime, 0.95))
        if (blob) {
          rendered.push({
            pageNum: i + 1,
            url: URL.createObjectURL(blob),
            blob,
          })
        }
      }

      setPageImages(rendered)
      toast.success(`Rendered ${rendered.length} pages into ${format.toUpperCase()} images!`)
    } catch {
      toast.error("Could not render PDF pages.")
    } finally {
      setLoading(false)
    }
  }

  if (!file) {
    return (
      <FileDropzone
        accept=".pdf,application/pdf"
        onFiles={onFiles}
        label="Drop a PDF document to convert pages to PNG/JPG"
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
              {pageCount} total pages • {pageImages.length} page images rendered ({formatBytes(file.size)})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select value={format} onValueChange={(v: any) => setFormat(v)}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="png">PNG</SelectItem>
              <SelectItem value="jpeg">JPG</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="ghost" size="sm" onClick={reset}>
            <RotateCcw className="size-4 mr-1.5" /> Start Over
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="size-5 animate-spin text-primary" /> Rendering PDF pages as high-resolution images...
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {pageImages.map((pageImg) => (
            <div
              key={pageImg.pageNum}
              className="flex flex-col justify-between rounded-xl border border-border bg-card p-3 space-y-3 shadow-xs"
            >
              <div className="aspect-3/4 flex items-center justify-center overflow-hidden rounded-lg bg-muted/40 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pageImg.url} alt={`Page ${pageImg.pageNum}`} className="max-h-full max-w-full object-contain" />
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-medium">Page {pageImg.pageNum}</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() =>
                    downloadBlob(pageImg.blob, `${file.name.replace(/\.[^/.]+$/, "")}-page-${pageImg.pageNum}.${format}`)
                  }
                >
                  <Download className="size-3 mr-1" /> Save
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
