"use client"

import { useState } from "react"
import { PDFDocument } from "pdf-lib"
import { FileText, Copy, Download, Check, RotateCcw, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { FileDropzone } from "@/components/file-dropzone"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { downloadBlob, formatBytes } from "@/lib/download"

export default function ExtractText() {
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState<number>(0)
  const [extractedText, setExtractedText] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  function reset() {
    setFile(null)
    setPageCount(0)
    setExtractedText("")
    setCopied(false)
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
      setPageCount(pdfDoc.getPageCount())

      // Extract text content from PDF page streams
      let textContent = ""
      const pages = pdfDoc.getPages()
      pages.forEach((page, index) => {
        textContent += `--- Page ${index + 1} ---\n`
        try {
          // Parse stream text tokens
          const node = page.node
          const contents = node.Contents()
          if (contents) {
            const rawBytes = (contents as any).asUint8Array
              ? (contents as any).asUint8Array()
              : (contents as any).getContents
                ? (contents as any).getContents()
                : new Uint8Array()
            const rawStr = new TextDecoder("latin1").decode(rawBytes)
            const textMatches = rawStr.match(/\(([^)]+)\)\s*Tj|\[((?:.|\n)*?)\]\s*TJ/g)
            if (textMatches) {
              const cleaned = textMatches
                .map((m) => m.replace(/\\|\(|\)|Tj|TJ|\[|\]/g, ""))
                .join(" ")
              textContent += cleaned.trim() + "\n\n"
            }
          }
        } catch {
          // Fallback if page stream parse fails
        }
      })

      if (!textContent.trim() || textContent.replaceAll(/- Page \d+ -/g, "").trim().length === 0) {
        textContent = "Notice: This PDF document contains scanned raster images or custom font encodings that require OCR."
      }

      setExtractedText(textContent)
      toast.success("Text extracted successfully!")
    } catch {
      toast.error("Could not parse PDF text.")
    } finally {
      setLoading(false)
    }
  }

  function copyText() {
    navigator.clipboard.writeText(extractedText)
    setCopied(true)
    toast.success("Text copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  function downloadTxt() {
    if (!extractedText || !file) return
    const blob = new Blob([extractedText], { type: "text/plain;charset=utf-8" })
    downloadBlob(blob, `${file.name.replace(/\.[^/.]+$/, "")}-extracted.txt`)
  }

  const wordCount = extractedText ? extractedText.trim().split(/\s+/).length : 0

  if (!file) {
    return (
      <FileDropzone
        accept=".pdf,application/pdf"
        onFiles={onFiles}
        label="Drop a PDF file to extract plain text"
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
              {pageCount} total pages • {wordCount.toLocaleString()} words extracted ({formatBytes(file.size)})
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={reset}>
          <RotateCcw className="size-4 mr-1.5" /> Start Over
        </Button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="size-5 animate-spin text-primary" /> Extracting text content from PDF...
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Extracted Text Content</span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={copyText}>
                {copied ? <Check className="size-3.5 mr-1 text-emerald-500" /> : <Copy className="size-3.5 mr-1" />}
                Copy Text
              </Button>
              <Button size="sm" variant="default" className="h-8 text-xs" onClick={downloadTxt}>
                <Download className="size-3.5 mr-1" /> Download .TXT
              </Button>
            </div>
          </div>

          <Textarea
            value={extractedText}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setExtractedText(e.target.value)}
            className="font-mono text-xs h-96 resize-y"
          />
        </div>
      )}
    </div>
  )
}
