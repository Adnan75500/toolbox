"use client"

import { useState } from "react"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import { FileText, Hash, Download, RotateCcw, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { FileDropzone } from "@/components/file-dropzone"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { downloadBlob, formatBytes } from "@/lib/download"

export default function PageNumbers() {
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState<number>(0)
  const [position, setPosition] = useState<"bottom-center" | "bottom-right" | "bottom-left" | "top-right" | "top-center">("bottom-center")
  const [format, setFormat] = useState<"page-x-of-y" | "x-of-y" | "page-x" | "x">("page-x-of-y")
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
      toast.error("Could not parse PDF document.")
    }
  }

  async function addPageNumbers() {
    if (!file || pageCount === 0) return
    setLoading(true)
    try {
      const buffer = await file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const pages = pdfDoc.getPages()
      const fontSize = 10
      const margin = 20

      pages.forEach((page, index) => {
        const { width, height } = page.getSize()
        const pageNum = index + 1

        let text = `Page ${pageNum} of ${pageCount}`
        if (format === "x-of-y") text = `${pageNum} / ${pageCount}`
        else if (format === "page-x") text = `Page ${pageNum}`
        else if (format === "x") text = `${pageNum}`

        const textWidth = font.widthOfTextAtSize(text, fontSize)
        let x = width / 2 - textWidth / 2
        let y = margin

        if (position === "bottom-left") x = margin
        else if (position === "bottom-right") x = width - margin - textWidth
        else if (position === "top-center") y = height - margin - 10
        else if (position === "top-right") {
          x = width - margin - textWidth
          y = height - margin - 10
        }

        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(0.3, 0.3, 0.3),
        })
      })

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes], { type: "application/pdf" })
      setOutputBlob(blob)
      toast.success("Page numbers inserted into PDF!")
    } catch {
      toast.error("Failed to add page numbers.")
    } finally {
      setLoading(false)
    }
  }

  if (!file) {
    return (
      <FileDropzone
        accept=".pdf,application/pdf"
        onFiles={onFiles}
        label="Drop a PDF document to insert page numbers"
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
          <Hash className="size-4 text-primary" /> Page Number Options
        </div>

        <div className="space-y-1.5">
          <Select value={position} onValueChange={(v: any) => setPosition(v)}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bottom-center">Bottom Center</SelectItem>
              <SelectItem value="bottom-right">Bottom Right</SelectItem>
              <SelectItem value="bottom-left">Bottom Left</SelectItem>
              <SelectItem value="top-center">Top Center</SelectItem>
              <SelectItem value="top-right">Top Right</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Select value={format} onValueChange={(v: any) => setFormat(v)}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="page-x-of-y">"Page 1 of 10"</SelectItem>
              <SelectItem value="x-of-y">"1 / 10"</SelectItem>
              <SelectItem value="page-x">"Page 1"</SelectItem>
              <SelectItem value="x">"1"</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={addPageNumbers} disabled={loading} className="w-full">
          {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
          Insert Page Numbers
        </Button>
      </div>

      {outputBlob && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            Numbered PDF Ready ({formatBytes(outputBlob.size)})
          </span>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => downloadBlob(outputBlob, `numbered-${file.name}`)}
          >
            <Download className="size-4 mr-2" /> Download Numbered PDF
          </Button>
        </div>
      )}
    </div>
  )
}
