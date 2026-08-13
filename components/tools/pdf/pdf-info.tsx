"use client"

import { useState } from "react"
import { PDFDocument } from "pdf-lib"
import { FileText, Info, FileCode, RotateCcw, Download } from "lucide-react"
import { toast } from "sonner"
import { FileDropzone } from "@/components/file-dropzone"
import { Button } from "@/components/ui/button"
import { downloadBlob, formatBytes } from "@/lib/download"

interface PdfInfoDetails {
  pageCount: number
  title?: string
  author?: string
  subject?: string
  keywords?: string
  creator?: string
  producer?: string
  creationDate?: string
  modificationDate?: string
  widthPt: number
  heightPt: number
  widthMm: number
  heightMm: number
  isEncrypted: boolean
}

export default function PdfInfo() {
  const [file, setFile] = useState<File | null>(null)
  const [info, setInfo] = useState<PdfInfoDetails | null>(null)
  const [loading, setLoading] = useState(false)

  function reset() {
    setFile(null)
    setInfo(null)
  }

  async function onFiles(files: File[]) {
    const f = files[0]
    if (f.type !== "application/pdf" && !f.name.endsWith(".pdf")) {
      toast.error("Please upload a valid PDF document.")
      return
    }
    reset()
    setFile(f)
    setLoading(true)

    try {
      const buffer = await f.arrayBuffer()
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })

      const pageCount = pdfDoc.getPageCount()
      const firstPage = pageCount > 0 ? pdfDoc.getPage(0) : null
      const size = firstPage ? firstPage.getSize() : { width: 0, height: 0 }

      const kw = pdfDoc.getKeywords()
      const kwStr = Array.isArray(kw) ? kw.join(", ") : kw || "N/A"

      const details: PdfInfoDetails = {
        pageCount,
        title: pdfDoc.getTitle() || "N/A",
        author: pdfDoc.getAuthor() || "N/A",
        subject: pdfDoc.getSubject() || "N/A",
        keywords: kwStr,
        creator: pdfDoc.getCreator() || "N/A",
        producer: pdfDoc.getProducer() || "N/A",
        creationDate: pdfDoc.getCreationDate()?.toLocaleString() || "N/A",
        modificationDate: pdfDoc.getModificationDate()?.toLocaleString() || "N/A",
        widthPt: Math.round(size.width),
        heightPt: Math.round(size.height),
        widthMm: Math.round((size.width * 25.4) / 72),
        heightMm: Math.round((size.height * 25.4) / 72),
        isEncrypted: pdfDoc.isEncrypted,
      }

      setInfo(details)
    } catch {
      toast.error("Could not parse PDF info.")
    } finally {
      setLoading(false)
    }
  }

  function exportInfoJson() {
    if (!info || !file) return
    const data = {
      filename: file.name,
      fileSize: file.size,
      fileSizeBytes: formatBytes(file.size),
      ...info,
    }
    const jsonStr = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonStr], { type: "application/json" })
    downloadBlob(blob, `${file.name.replace(/\.[^/.]+$/, "")}-info.json`)
  }

  if (!file) {
    return (
      <FileDropzone
        accept=".pdf,application/pdf"
        onFiles={onFiles}
        label="Drop a PDF file to inspect detailed properties & metadata"
        hint="Processed 100% locally on your device"
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Info className="size-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{file.name}</h3>
            <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {info && (
            <Button size="sm" variant="outline" onClick={exportInfoJson}>
              <Download className="size-4 mr-1.5" /> Export JSON
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={reset}>
            <RotateCcw className="size-4 mr-1.5" /> Start Over
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Reading PDF properties...</div>
      ) : info ? (
        <div className="grid gap-6 md:grid-cols-2">
          {/* General & Page Specs */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2 font-medium text-sm border-b border-border pb-2">
              <FileText className="size-4 text-primary" /> Document Specifications
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground">Page Count:</span>{" "}
                <span className="font-mono font-semibold text-foreground">{info.pageCount} pages</span>
              </div>
              <div>
                <span className="text-muted-foreground">Encrypted:</span>{" "}
                <span className="font-mono font-semibold text-foreground">{info.isEncrypted ? "Yes" : "No"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Page Size (pt):</span>{" "}
                <span className="font-mono">{info.widthPt} × {info.heightPt} pt</span>
              </div>
              <div>
                <span className="text-muted-foreground">Page Size (mm):</span>{" "}
                <span className="font-mono">{info.widthMm} × {info.heightMm} mm</span>
              </div>
              <div>
                <span className="text-muted-foreground">Creation Date:</span>{" "}
                <span className="font-mono truncate block">{info.creationDate}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Modification Date:</span>{" "}
                <span className="font-mono truncate block">{info.modificationDate}</span>
              </div>
            </div>
          </div>

          {/* Embedded Metadata */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2 font-medium text-sm border-b border-border pb-2">
              <FileCode className="size-4 text-primary" /> Embedded Metadata
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-muted-foreground block">Title:</span>
                <span className="font-mono font-medium">{info.title}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Author:</span>
                <span className="font-mono font-medium">{info.author}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Subject:</span>
                <span className="font-mono">{info.subject}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Keywords:</span>
                <span className="font-mono">{info.keywords}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Creator / Producer:</span>
                <span className="font-mono text-muted-foreground">{info.creator} / {info.producer}</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
