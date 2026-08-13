"use client"

import { useState } from "react"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import { FileText, Download, RotateCcw, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { FileDropzone } from "@/components/file-dropzone"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { downloadBlob, formatBytes } from "@/lib/download"

export default function HeaderFooter() {
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState<number>(0)
  const [headerText, setHeaderText] = useState<string>("DOCUMENT HEADER")
  const [footerText, setFooterText] = useState<string>("CONFIDENTIAL DOCUMENT")
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
      toast.error("Failed to load PDF file.")
    }
  }

  async function applyHeaderFooter() {
    if (!file || pageCount === 0) return
    setLoading(true)
    try {
      const buffer = await file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const pages = pdfDoc.getPages()
      const fontSize = 10
      const margin = 20

      pages.forEach((page) => {
        const { width, height } = page.getSize()

        // Draw Header
        if (headerText.trim()) {
          const hWidth = font.widthOfTextAtSize(headerText, fontSize)
          page.drawText(headerText, {
            x: width / 2 - hWidth / 2,
            y: height - margin - 10,
            size: fontSize,
            font,
            color: rgb(0.3, 0.3, 0.3),
          })
        }

        // Draw Footer
        if (footerText.trim()) {
          const fWidth = font.widthOfTextAtSize(footerText, fontSize)
          page.drawText(footerText, {
            x: width / 2 - fWidth / 2,
            y: margin,
            size: fontSize,
            font,
            color: rgb(0.3, 0.3, 0.3),
          })
        }
      })

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes], { type: "application/pdf" })
      setOutputBlob(blob)
      toast.success("Header & footer added to PDF!")
    } catch {
      toast.error("Failed to add header and footer.")
    } finally {
      setLoading(false)
    }
  }

  if (!file) {
    return (
      <FileDropzone
        accept=".pdf,application/pdf"
        onFiles={onFiles}
        label="Drop a PDF document to add headers and footers"
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

      <div className="rounded-xl border border-border bg-card p-5 space-y-4 max-w-md">
        <div className="space-y-1.5">
          <Label className="text-xs">Top Header Text</Label>
          <Input
            value={headerText}
            onChange={(e) => setHeaderText(e.target.value)}
            placeholder="Header text..."
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Bottom Footer Text</Label>
          <Input
            value={footerText}
            onChange={(e) => setFooterText(e.target.value)}
            placeholder="Footer text..."
          />
        </div>

        <Button onClick={applyHeaderFooter} disabled={loading} className="w-full">
          {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
          Apply Header & Footer
        </Button>
      </div>

      {outputBlob && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            PDF Ready ({formatBytes(outputBlob.size)})
          </span>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => downloadBlob(outputBlob, `header-footer-${file.name}`)}
          >
            <Download className="size-4 mr-2" /> Download PDF
          </Button>
        </div>
      )}
    </div>
  )
}
