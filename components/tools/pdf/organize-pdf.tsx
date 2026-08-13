"use client"

import { useState } from "react"
import { PDFDocument } from "pdf-lib"
import { FileText, ArrowLeft, ArrowRight, Trash2, Download, RotateCcw, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { FileDropzone } from "@/components/file-dropzone"
import { Button } from "@/components/ui/button"
import { downloadBlob, formatBytes } from "@/lib/download"

interface PageItem {
  id: string
  originalPageNumber: number
}

export default function OrganizePdf() {
  const [file, setFile] = useState<File | null>(null)
  const [pages, setPages] = useState<PageItem[]>([])
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null)
  const [loading, setLoading] = useState(false)

  function reset() {
    setFile(null)
    setPages([])
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
      const count = pdfDoc.getPageCount()

      const list: PageItem[] = []
      for (let i = 1; i <= count; i++) {
        list.push({
          id: Math.random().toString(36).substring(2, 9),
          originalPageNumber: i,
        })
      }
      setFile(f)
      setPages(list)
      setOutputBlob(null)
    } catch {
      toast.error("Could not parse PDF file.")
    }
  }

  function movePage(index: number, direction: -1 | 1) {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= pages.length) return
    const updated = [...pages]
    const temp = updated[index]
    updated[index] = updated[newIndex]
    updated[newIndex] = temp
    setPages(updated)
    setOutputBlob(null)
  }

  function deletePage(id: string) {
    if (pages.length <= 1) {
      toast.error("Cannot delete all pages from PDF.")
      return
    }
    setPages((prev) => prev.filter((p) => p.id !== id))
    setOutputBlob(null)
  }

  async function saveOrganizedPdf() {
    if (!file || pages.length === 0) return
    setLoading(true)
    try {
      const buffer = await file.arrayBuffer()
      const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
      const targetDoc = await PDFDocument.create()

      const pageIndices = pages.map((p) => p.originalPageNumber - 1)
      const copiedPages = await targetDoc.copyPages(srcDoc, pageIndices)
      copiedPages.forEach((page) => targetDoc.addPage(page))

      const pdfBytes = await targetDoc.save()
      const blob = new Blob([pdfBytes], { type: "application/pdf" })
      setOutputBlob(blob)
      toast.success("PDF pages organized successfully!")
    } catch {
      toast.error("Failed to save reordered PDF.")
    } finally {
      setLoading(false)
    }
  }

  if (!file) {
    return (
      <FileDropzone
        accept=".pdf,application/pdf"
        onFiles={onFiles}
        label="Drop a PDF file to reorder or remove pages"
        hint="Processed 100% locally on your machine"
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-5">
        <div>
          <h3 className="font-semibold text-sm">{file.name}</h3>
          <p className="text-xs text-muted-foreground">
            {pages.length} pages remaining • Reorder or delete pages below ({formatBytes(file.size)})
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={reset}>
          <RotateCcw className="size-4 mr-1.5" /> Start Over
        </Button>
      </div>

      {/* Pages Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
        {pages.map((item, index) => (
          <div
            key={item.id}
            className="flex flex-col items-center justify-between aspect-3/4 rounded-xl border border-border bg-card p-3 space-y-2 shadow-xs"
          >
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="size-5" />
            </div>
            <span className="font-mono text-xs font-semibold text-foreground">Page {item.originalPageNumber}</span>

            <div className="flex items-center gap-1 w-full justify-center border-t border-border pt-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-7 p-0"
                disabled={index === 0}
                onClick={() => movePage(index, -1)}
                title="Move Left"
              >
                <ArrowLeft className="size-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-7 p-0"
                disabled={index === pages.length - 1}
                onClick={() => movePage(index, 1)}
                title="Move Right"
              >
                <ArrowRight className="size-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                onClick={() => deletePage(item.id)}
                title="Delete Page"
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="flex flex-wrap items-center gap-4">
        <Button onClick={saveOrganizedPdf} disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
          Save Reordered PDF
        </Button>

        {outputBlob && (
          <Button
            onClick={() => downloadBlob(outputBlob, `organized-${file.name}`)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Download className="size-4 mr-2" /> Download Organized PDF ({formatBytes(outputBlob.size)})
          </Button>
        )}
      </div>
    </div>
  )
}
