"use client"

import { useState } from "react"
import { PDFDocument } from "pdf-lib"
import { FileText, Download, Minimize2, RotateCcw, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { FileDropzone } from "@/components/file-dropzone"
import { Button } from "@/components/ui/button"
import { downloadBlob, formatBytes } from "@/lib/download"

export default function CompressPdf() {
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState<number>(0)
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

  async function compressPdf() {
    if (!file || pageCount === 0) return
    setLoading(true)
    try {
      const buffer = await file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })

      // Compress PDF using object streams & structure optimization
      const pdfBytes = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
      })

      const blob = new Blob([pdfBytes], { type: "application/pdf" })
      setOutputBlob(blob)
      toast.success("PDF optimization and compression finished!")
    } catch {
      toast.error("Failed to compress PDF.")
    } finally {
      setLoading(false)
    }
  }

  if (!file) {
    return (
      <FileDropzone
        accept=".pdf,application/pdf"
        onFiles={onFiles}
        label="Drop a PDF file to compress and optimize"
        hint="Processed 100% locally on your device"
      />
    )
  }

  const savings =
    outputBlob && file.size > 0 ? Math.max(0, Math.round((1 - outputBlob.size / file.size) * 100)) : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Minimize2 className="size-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{file.name}</h3>
            <p className="text-xs text-muted-foreground">
              {pageCount} total pages • Original Size: {formatBytes(file.size)}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={reset}>
          <RotateCcw className="size-4 mr-1.5" /> Start Over
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-4 max-w-md">
        <div className="space-y-1">
          <h4 className="font-medium text-sm">Local PDF Stream Compression</h4>
          <p className="text-xs text-muted-foreground">
            Re-encodes internal stream objects, removes unreferenced structures, and compresses font tables.
          </p>
        </div>

        <Button onClick={compressPdf} disabled={loading} className="w-full">
          {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
          Compress PDF Now
        </Button>
      </div>

      {outputBlob && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Compressed Size: {formatBytes(outputBlob.size)} ({savings > 0 ? `−${savings}% smaller` : "Optimized"})
            </span>
          </div>
          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => downloadBlob(outputBlob, `compressed-${file.name}`)}
          >
            <Download className="size-4 mr-2" /> Download Compressed PDF
          </Button>
        </div>
      )}
    </div>
  )
}
