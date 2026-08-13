"use client"

import { useState } from "react"
import { PDFDocument } from "pdf-lib"
import { FileText, ArrowUp, ArrowDown, Trash2, Download, Plus, RotateCcw, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { downloadBlob, formatBytes } from "@/lib/download"

interface PdfItem {
  id: string
  file: File
  pageCount: number
}

export default function MergePdf() {
  const [items, setItems] = useState<PdfItem[]>([])
  const [loading, setLoading] = useState(false)
  const [mergedBlob, setMergedBlob] = useState<Blob | null>(null)

  async function addFiles(files: FileList | File[]) {
    const newItems: PdfItem[] = []
    for (const f of Array.from(files)) {
      if (f.type === "application/pdf" || f.name.endsWith(".pdf")) {
        try {
          const buffer = await f.arrayBuffer()
          const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
          newItems.push({
            id: Math.random().toString(36).substring(2, 9),
            file: f,
            pageCount: pdfDoc.getPageCount(),
          })
        } catch {
          toast.error(`Could not read ${f.name}. It may be encrypted or corrupted.`)
        }
      }
    }
    setItems((prev) => [...prev, ...newItems])
    setMergedBlob(null)
  }

  function moveItem(index: number, direction: -1 | 1) {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= items.length) return
    const updated = [...items]
    const temp = updated[index]
    updated[index] = updated[newIndex]
    updated[newIndex] = temp
    setItems(updated)
    setMergedBlob(null)
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
    setMergedBlob(null)
  }

  function resetAll() {
    setItems([])
    setMergedBlob(null)
  }

  async function mergePdfs() {
    if (items.length < 2) {
      toast.error("Please add at least 2 PDF files to merge.")
      return
    }

    setLoading(true)
    try {
      const mergedPdfDoc = await PDFDocument.create()

      for (const item of items) {
        const buffer = await item.file.arrayBuffer()
        const donorPdf = await PDFDocument.load(buffer, { ignoreEncryption: true })
        const pageIndices = donorPdf.getPageIndices()
        const copiedPages = await mergedPdfDoc.copyPages(donorPdf, pageIndices)
        copiedPages.forEach((page) => mergedPdfDoc.addPage(page))
      }

      const pdfBytes = await mergedPdfDoc.save()
      const blob = new Blob([pdfBytes], { type: "application/pdf" })
      setMergedBlob(blob)
      toast.success("PDFs merged successfully!")
    } catch {
      toast.error("An error occurred while merging the PDF files.")
    } finally {
      setLoading(false)
    }
  }

  const totalPages = items.reduce((acc, curr) => acc + curr.pageCount, 0)
  const totalSizeBytes = items.reduce((acc, curr) => acc + curr.file.size, 0)

  return (
    <div className="space-y-6">
      {/* Upload Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-5">
        <div>
          <h3 className="font-semibold text-sm">Merge Multiple PDF Files</h3>
          <p className="text-xs text-muted-foreground">
            {items.length === 0
              ? "Select 2 or more PDF documents to combine into a single file"
              : `${items.length} files selected • ${totalPages} total pages (${formatBytes(totalSizeBytes)})`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".pdf,application/pdf"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
            <span className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors">
              <Plus className="size-4 mr-1.5" /> Add PDFs
            </span>
          </label>
          {items.length > 0 && (
            <Button size="sm" variant="ghost" onClick={resetAll}>
              <RotateCcw className="size-4 mr-1.5" /> Clear All
            </Button>
          )}
        </div>
      </div>

      {/* PDF Items Reorder List */}
      {items.length > 0 && (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="size-5" />
                </div>
                <div>
                  <h4 className="font-medium text-xs truncate max-w-xs sm:max-w-md">{item.file.name}</h4>
                  <p className="text-[11px] text-muted-foreground">
                    {item.pageCount} page{item.pageCount > 1 ? "s" : ""} • {formatBytes(item.file.size)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0"
                  disabled={index === 0}
                  onClick={() => moveItem(index, -1)}
                  title="Move Up"
                >
                  <ArrowUp className="size-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0"
                  disabled={index === items.length - 1}
                  onClick={() => moveItem(index, 1)}
                  title="Move Down"
                >
                  <ArrowDown className="size-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                  onClick={() => removeItem(item.id)}
                  title="Remove"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}

          {/* Actions */}
          <div className="pt-4 flex flex-wrap items-center gap-4">
            <Button onClick={mergePdfs} disabled={items.length < 2 || loading} className="flex-1 sm:flex-none">
              {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              {loading ? "Merging PDFs..." : "Merge PDFs Now"}
            </Button>

            {mergedBlob && (
              <Button
                variant="secondary"
                onClick={() => downloadBlob(mergedBlob, "merged-document.pdf")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Download className="size-4 mr-2" /> Download Merged PDF ({formatBytes(mergedBlob.size)})
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
