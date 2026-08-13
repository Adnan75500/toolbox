"use client"

import { useState } from "react"
import { PDFDocument } from "pdf-lib"
import { FileText, Download, Scissors, RotateCcw, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { FileDropzone } from "@/components/file-dropzone"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { downloadBlob, formatBytes } from "@/lib/download"

export default function SplitPdf() {
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState<number>(0)
  const [rangeInput, setRangeInput] = useState<string>("1-2")
  const [splitEvery, setSplitEvery] = useState<number>(1)

  const [rangeBlob, setRangeBlob] = useState<Blob | null>(null)
  const [splitBlobs, setSplitBlobs] = useState<Array<{ name: string; blob: Blob }>>([])
  const [loading, setLoading] = useState(false)

  function reset() {
    setFile(null)
    setPageCount(0)
    setRangeBlob(null)
    setSplitBlobs([])
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
      setFile(f)
      setPageCount(count)
      setRangeInput(count > 1 ? `1-${Math.ceil(count / 2)}` : "1")
      setRangeBlob(null)
      setSplitBlobs([])
    } catch {
      toast.error("Could not load PDF document.")
    }
  }

  // Handle Range Split
  async function handleRangeSplit() {
    if (!file || pageCount === 0) return
    setLoading(true)
    try {
      const buffer = await file.arrayBuffer()
      const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
      const targetDoc = await PDFDocument.create()

      // Parse range string e.g., "1-3, 5, 7-10"
      const pagesToInclude = parsePageRanges(rangeInput, pageCount)
      if (pagesToInclude.length === 0) {
        toast.error("Invalid page range specified.")
        setLoading(false)
        return
      }

      const indices = pagesToInclude.map((p) => p - 1)
      const copiedPages = await targetDoc.copyPages(srcDoc, indices)
      copiedPages.forEach((p) => targetDoc.addPage(p))

      const pdfBytes = await targetDoc.save()
      const blob = new Blob([pdfBytes], { type: "application/pdf" })
      setRangeBlob(blob)
      toast.success(`Split ${pagesToInclude.length} pages into new PDF!`)
    } catch {
      toast.error("Failed to split PDF by page range.")
    } finally {
      setLoading(false)
    }
  }

  // Handle Split Every N Pages
  async function handleEveryNSplit() {
    if (!file || pageCount === 0) return
    setLoading(true)
    try {
      const buffer = await file.arrayBuffer()
      const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
      const results: Array<{ name: string; blob: Blob }> = []

      let part = 1
      for (let i = 0; i < pageCount; i += splitEvery) {
        const targetDoc = await PDFDocument.create()
        const indices: number[] = []
        for (let j = i; j < Math.min(i + splitEvery, pageCount); j++) {
          indices.push(j)
        }
        const copied = await targetDoc.copyPages(srcDoc, indices)
        copied.forEach((p) => targetDoc.addPage(p))

        const pdfBytes = await targetDoc.save()
        const blob = new Blob([pdfBytes], { type: "application/pdf" })
        const baseName = file.name.replace(/\.[^/.]+$/, "")
        results.push({ name: `${baseName}-part-${part}.pdf`, blob })
        part++
      }

      setSplitBlobs(results)
      toast.success(`Split into ${results.length} separate PDF files!`)
    } catch {
      toast.error("Failed to split PDF.")
    } finally {
      setLoading(false)
    }
  }

  if (!file) {
    return (
      <FileDropzone
        accept=".pdf,application/pdf"
        onFiles={onFiles}
        label="Drop a PDF file to split into separate pages or ranges"
        hint="Processed 100% locally on your machine"
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* File Banner */}
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

      {/* Tabs Modes */}
      <Tabs defaultValue="range" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-6">
          <TabsTrigger value="range">Extract Range (e.g. 1-3, 5)</TabsTrigger>
          <TabsTrigger value="every">Split Every N Pages</TabsTrigger>
        </TabsList>

        <TabsContent value="range" className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 max-w-md">
            <div className="space-y-1.5">
              <Label className="text-xs">Page Ranges to Extract</Label>
              <Input
                value={rangeInput}
                onChange={(e) => setRangeInput(e.target.value)}
                placeholder="e.g. 1-3, 5, 8-10"
              />
              <p className="text-[11px] text-muted-foreground">
                Enter page numbers and/or ranges separated by commas (1 to {pageCount}).
              </p>
            </div>

            <Button onClick={handleRangeSplit} disabled={loading} className="w-full">
              {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Scissors className="size-4 mr-2" />}
              Extract & Split PDF
            </Button>
          </div>

          {rangeBlob && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Split PDF Ready ({formatBytes(rangeBlob.size)})
              </span>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => downloadBlob(rangeBlob, `split-${file.name}`)}
              >
                <Download className="size-4 mr-2" /> Download Split PDF
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="every" className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 max-w-md">
            <div className="space-y-1.5">
              <Label className="text-xs">Split Every N Pages</Label>
              <Input
                type="number"
                min={1}
                max={pageCount}
                value={splitEvery}
                onChange={(e) => setSplitEvery(Math.max(1, Number(e.target.value) || 1))}
              />
            </div>

            <Button onClick={handleEveryNSplit} disabled={loading} className="w-full">
              {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Scissors className="size-4 mr-2" />}
              Split into Parts
            </Button>
          </div>

          {splitBlobs.length > 0 && (
            <div className="space-y-3">
              <Label className="text-xs font-medium">Generated PDF Files ({splitBlobs.length})</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                {splitBlobs.map((part) => (
                  <div
                    key={part.name}
                    className="flex items-center justify-between rounded-xl border border-border bg-card p-3"
                  >
                    <span className="font-mono text-xs truncate max-w-[180px]">{part.name}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => downloadBlob(part.blob, part.name)}
                    >
                      <Download className="size-3.5 mr-1" /> Download
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function parsePageRanges(rangeStr: string, maxPage: number): number[] {
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
