"use client"

import { useState } from "react"
import { PDFDocument } from "pdf-lib"
import { FileText, FileCode, Download, RotateCcw, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { FileDropzone } from "@/components/file-dropzone"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { downloadBlob, formatBytes } from "@/lib/download"

export default function PdfMetadata() {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState<string>("")
  const [author, setAuthor] = useState<string>("")
  const [subject, setSubject] = useState<string>("")
  const [keywords, setKeywords] = useState<string>("")
  const [creator, setCreator] = useState<string>("")

  const [outputBlob, setOutputBlob] = useState<Blob | null>(null)
  const [loading, setLoading] = useState(false)

  function reset() {
    setFile(null)
    setTitle("")
    setAuthor("")
    setSubject("")
    setKeywords("")
    setCreator("")
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
      setTitle(pdfDoc.getTitle() || f.name.replace(/\.[^/.]+$/, ""))
      setAuthor(pdfDoc.getAuthor() || "")
      setSubject(pdfDoc.getSubject() || "")
      const kw = pdfDoc.getKeywords()
      setKeywords(Array.isArray(kw) ? kw.join(", ") : kw || "")
      setCreator(pdfDoc.getCreator() || "")
      setOutputBlob(null)
    } catch {
      toast.error("Failed to read PDF metadata.")
    }
  }

  async function saveMetadata() {
    if (!file) return
    setLoading(true)
    try {
      const buffer = await file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })

      pdfDoc.setTitle(title)
      pdfDoc.setAuthor(author)
      pdfDoc.setSubject(subject)
      pdfDoc.setKeywords(keywords.split(",").map((s) => s.trim()))
      pdfDoc.setCreator(creator || "Toolbox PDF Engine")

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes], { type: "application/pdf" })
      setOutputBlob(blob)
      toast.success("PDF metadata updated successfully!")
    } catch {
      toast.error("Failed to save PDF metadata.")
    } finally {
      setLoading(false)
    }
  }

  if (!file) {
    return (
      <FileDropzone
        accept=".pdf,application/pdf"
        onFiles={onFiles}
        label="Drop a PDF file to view & edit metadata"
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
            <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={reset}>
          <RotateCcw className="size-4 mr-1.5" /> Start Over
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-4 max-w-md">
        <div className="flex items-center gap-2 font-medium text-sm border-b border-border pb-2">
          <FileCode className="size-4 text-primary" /> Edit Metadata Fields
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Document Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Author</Label>
          <Input value={author} onChange={(e) => setAuthor(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Subject / Description</Label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Keywords (comma-separated)</Label>
          <Input value={keywords} onChange={(e) => setKeywords(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Creator / Generator</Label>
          <Input value={creator} onChange={(e) => setCreator(e.target.value)} />
        </div>

        <Button onClick={saveMetadata} disabled={loading} className="w-full">
          {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
          Save Metadata to PDF
        </Button>
      </div>

      {outputBlob && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            Metadata Updated PDF Ready ({formatBytes(outputBlob.size)})
          </span>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => downloadBlob(outputBlob, `meta-${file.name}`)}
          >
            <Download className="size-4 mr-2" /> Download PDF
          </Button>
        </div>
      )}
    </div>
  )
}
