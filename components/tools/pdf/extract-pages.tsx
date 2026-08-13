"use client"

import { useState } from "react"
import { PDFDocument } from "pdf-lib"
import { FileText, Download, CheckSquare, Square, Trash2, RotateCcw, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { FileDropzone } from "@/components/file-dropzone"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { downloadBlob, formatBytes } from "@/lib/download"

export default function ExtractPages() {
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState<number>(0)
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set())
  const [mode, setMode] = useState<"keep" | "delete">("keep")
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null)
  const [loading, setLoading] = useState(false)

  function reset() {
    setFile(null)
    setPageCount(0)
    setSelectedPages(new Set())
    setOutputBlob(null)
  }

  async function onFiles(files: File[]) {
    const f = files[0]
    if (f.type !== "application/pdf" && !f.name.endsWith(".pdf")) {
      toast.error("Please select a valid PDF document.")
      return
    }
    try {
      const buffer = await f.arrayBuffer()
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
      const count = pdfDoc.getPageCount()
      setFile(f)
      setPageCount(count)
      setSelectedPages(new Set([1]))
      setOutputBlob(null)
    } catch {
      toast.error("Failed to parse PDF document.")
    }
  }

  function togglePage(pageNum: number) {
    setSelectedPages((prev) => {
      const next = new Set(prev)
      if (next.has(pageNum)) next.delete(pageNum)
      else next.add(pageNum)
      return next
    })
    setOutputBlob(null)
  }

  function selectAll() {
    const all = new Set<number>()
    for (let i = 1; i <= pageCount; i++) all.add(i)
    setSelectedPages(all)
    setOutputBlob(null)
  }

  function selectNone() {
    setSelectedPages(new Set())
    setOutputBlob(null)
  }

  async function processPages() {
    if (!file || pageCount === 0) return
    if (selectedPages.size === 0 && mode === "keep") {
      toast.error("Please select at least one page to keep.")
      return
    }

    setLoading(true)
    try {
      const buffer = await file.arrayBuffer()
      const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
      const targetDoc = await PDFDocument.create()

      const indicesToInclude: number[] = []
      for (let i = 1; i <= pageCount; i++) {
        const isSelected = selectedPages.has(i)
        if ((mode === "keep" && isSelected) || (mode === "delete" && !isSelected)) {
          indicesToInclude.push(i - 1)
        }
      }

      if (indicesToInclude.length === 0) {
        toast.error("No pages remain after processing.")
        setLoading(false)
        return
      }

      const copiedPages = await targetDoc.copyPages(srcDoc, indicesToInclude)
      copiedPages.forEach((p) => targetDoc.addPage(p))

      const pdfBytes = await targetDoc.save()
      const blob = new Blob([pdfBytes], { type: "application/pdf" })
      setOutputBlob(blob)
      toast.success(`Generated PDF with ${indicesToInclude.length} pages!`)
    } catch {
      toast.error("An error occurred while processing PDF pages.")
    } finally {
      setLoading(false)
    }
  }

  if (!file) {
    return (
      <FileDropzone
        accept=".pdf,application/pdf"
        onFiles={onFiles}
        label="Drop a PDF file to extract or remove pages"
        hint="Processed 100% locally on your device"
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-5">
        <div>
          <h3 className="font-semibold text-sm">{file.name}</h3>
          <p className="text-xs text-muted-foreground">
            {pageCount} total pages • {selectedPages.size} selected ({formatBytes(file.size)})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select value={mode} onValueChange={(v: any) => setMode(v)}>
            <SelectTrigger className="w-44 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="keep">Keep Selected Pages</SelectItem>
              <SelectItem value="delete">Remove Selected Pages</SelectItem>
            </SelectContent>
          </Select>

          <Button size="sm" variant="outline" onClick={selectAll}>
            <CheckSquare className="size-3.5 mr-1" /> Select All
          </Button>
          <Button size="sm" variant="outline" onClick={selectNone}>
            <Square className="size-3.5 mr-1" /> Clear Selection
          </Button>
          <Button size="sm" variant="ghost" onClick={reset}>
            <RotateCcw className="size-4" />
          </Button>
        </div>
      </div>

      {/* Pages Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
        {Array.from({ length: pageCount }, (_, i) => i + 1).map((pageNum) => {
          const isSelected = selectedPages.has(pageNum)
          return (
            <button
              key={pageNum}
              onClick={() => togglePage(pageNum)}
              className={`flex flex-col items-center justify-between aspect-3/4 rounded-xl border p-3 transition-all text-left relative group ${
                isSelected
                  ? "border-primary bg-primary/10 ring-2 ring-primary/40"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:text-primary">
                <FileText className="size-5" />
              </div>
              <span className="font-mono text-xs font-medium">Page {pageNum}</span>
            </button>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-4">
        <Button onClick={processPages} disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
          {mode === "keep" ? "Extract Selected Pages" : "Remove Selected Pages"}
        </Button>

        {outputBlob && (
          <Button
            onClick={() => downloadBlob(outputBlob, `extracted-${file.name}`)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Download className="size-4 mr-2" /> Download Output PDF ({formatBytes(outputBlob.size)})
          </Button>
        )}
      </div>
    </div>
  )
}
