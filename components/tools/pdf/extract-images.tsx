"use client"

import { useState } from "react"
import { PDFDocument, PDFName, PDFRawStream } from "pdf-lib"
import { FileText, Image as ImageIcon, Download, RotateCcw, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { FileDropzone } from "@/components/file-dropzone"
import { Button } from "@/components/ui/button"
import { downloadBlob, formatBytes } from "@/lib/download"

interface ExtractedImage {
  id: string
  name: string
  url: string
  blob: Blob
}

export default function ExtractImages() {
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState<number>(0)
  const [images, setImages] = useState<ExtractedImage[]>([])
  const [loading, setLoading] = useState(false)

  function reset() {
    images.forEach((img) => URL.revokeObjectURL(img.url))
    setFile(null)
    setPageCount(0)
    setImages([])
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

      const extracted: ExtractedImage[] = []
      let imgIndex = 1

      // Search all indirect objects in the PDF for XObject images
      const indirectObjects = pdfDoc.context.enumerateIndirectObjects()
      for (const [, obj] of indirectObjects) {
        if (obj instanceof PDFRawStream) {
          const dict = obj.dict
          const type = dict.get(PDFName.of("Type"))
          const subtype = dict.get(PDFName.of("Subtype"))

          if (subtype === PDFName.of("Image") || type === PDFName.of("XObject")) {
            try {
              const filter = dict.get(PDFName.of("Filter"))
              let mime = "image/jpeg"
              let ext = "jpg"

              if (filter === PDFName.of("DCTDecode")) {
                mime = "image/jpeg"
                ext = "jpg"
              } else if (filter === PDFName.of("JPXDecode")) {
                mime = "image/jp2"
                ext = "jp2"
              } else {
                mime = "image/png"
                ext = "png"
              }

              const bytes = obj.getContents()
              const blob = new Blob([bytes], { type: mime })
              const url = URL.createObjectURL(blob)

              extracted.push({
                id: Math.random().toString(36).substring(2, 9),
                name: `image-${imgIndex}.${ext}`,
                url,
                blob,
              })
              imgIndex++
            } catch {
              // Ignore single unparseable stream
            }
          }
        }
      }

      setImages(extracted)
      if (extracted.length === 0) {
        toast.info("No embedded raster images found in this PDF document.")
      } else {
        toast.success(`Extracted ${extracted.length} images!`)
      }
    } catch {
      toast.error("Could not parse PDF file.")
    } finally {
      setLoading(false)
    }
  }

  if (!file) {
    return (
      <FileDropzone
        accept=".pdf,application/pdf"
        onFiles={onFiles}
        label="Drop a PDF document to extract all embedded images"
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
              {pageCount} total pages • {images.length} embedded images extracted ({formatBytes(file.size)})
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={reset}>
          <RotateCcw className="size-4 mr-1.5" /> Start Over
        </Button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="size-5 animate-spin text-primary" /> Scanning PDF object streams for images...
        </div>
      ) : images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((img) => (
            <div
              key={img.id}
              className="flex flex-col justify-between rounded-xl border border-border bg-card p-3 space-y-3 shadow-xs"
            >
              <div className="aspect-square flex items-center justify-center overflow-hidden rounded-lg bg-muted/40 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.name} className="max-h-full max-w-full object-contain" />
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs truncate">{img.name}</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => downloadBlob(img.blob, img.name)}
                >
                  <Download className="size-3 mr-1" /> Save
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center text-sm text-muted-foreground rounded-xl border border-dashed border-border">
          <ImageIcon className="size-8 mb-2 mx-auto text-muted-foreground/60" />
          No raster images were found embedded in this PDF file.
        </div>
      )}
    </div>
  )
}
