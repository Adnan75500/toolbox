"use client"

import { useState } from "react"
import { PDFDocument, PageSizes } from "pdf-lib"
import { FileText, ArrowUp, ArrowDown, Trash2, Download, Plus, RotateCcw, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { downloadBlob, formatBytes } from "@/lib/download"
import { loadImage, readFileAsDataURL } from "@/lib/image"

interface ImageItem {
  id: string
  file: File
  url: string
}

export default function ImageToPdf() {
  const [items, setItems] = useState<ImageItem[]>([])
  const [pageSize, setPageSize] = useState<"fit" | "a4" | "letter">("a4")
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait")
  const [margin, setMargin] = useState<number>(20)
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null)
  const [loading, setLoading] = useState(false)

  function addFiles(files: FileList | File[]) {
    const newItems: ImageItem[] = []
    Array.from(files).forEach((f) => {
      if (f.type.startsWith("image/")) {
        newItems.push({
          id: Math.random().toString(36).substring(2, 9),
          file: f,
          url: URL.createObjectURL(f),
        })
      }
    })
    setItems((prev) => [...prev, ...newItems])
    setOutputBlob(null)
  }

  function moveItem(index: number, direction: -1 | 1) {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= items.length) return
    const updated = [...items]
    const temp = updated[index]
    updated[index] = updated[newIndex]
    updated[newIndex] = temp
    setItems(updated)
    setOutputBlob(null)
  }

  function removeItem(id: string) {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id)
      if (target) URL.revokeObjectURL(target.url)
      return prev.filter((i) => i.id !== id)
    })
    setOutputBlob(null)
  }

  function resetAll() {
    items.forEach((i) => URL.revokeObjectURL(i.url))
    setItems([])
    setOutputBlob(null)
  }

  async function convertToPdf() {
    if (items.length === 0) return
    setLoading(true)
    try {
      const pdfDoc = await PDFDocument.create()

      for (const item of items) {
        const buffer = await item.file.arrayBuffer()
        let embeddedImg
        if (item.file.type === "image/png") {
          embeddedImg = await pdfDoc.embedPng(buffer)
        } else if (item.file.type === "image/jpeg" || item.file.type === "image/jpg") {
          embeddedImg = await pdfDoc.embedJpg(buffer)
        } else {
          // Convert other formats (WebP, GIF) to PNG data URL via canvas
          const dataUrl = await readFileAsDataURL(item.file)
          const imgEl = await loadImage(dataUrl)
          const canvas = document.createElement("canvas")
          canvas.width = imgEl.width
          canvas.height = imgEl.height
          const ctx = canvas.getContext("2d")
          if (!ctx) continue
          ctx.drawImage(imgEl, 0, 0)
          const pngDataUrl = canvas.toDataURL("image/png")
          const base64Bytes = Uint8Array.from(atob(pngDataUrl.split(",")[1]), (c) => c.charCodeAt(0))
          embeddedImg = await pdfDoc.embedPng(base64Bytes)
        }

        let pWidth = embeddedImg.width
        let pHeight = embeddedImg.height

        if (pageSize === "a4") {
          pWidth = PageSizes.A4[0]
          pHeight = PageSizes.A4[1]
        } else if (pageSize === "letter") {
          pWidth = PageSizes.Letter[0]
          pHeight = PageSizes.Letter[1]
        }

        if (orientation === "landscape" && pageSize !== "fit") {
          const temp = pWidth
          pWidth = pHeight
          pHeight = temp
        }

        const page = pdfDoc.addPage([pWidth, pHeight])

        // Calculate fitted image dimensions inside page margins
        const availW = Math.max(10, pWidth - margin * 2)
        const availH = Math.max(10, pHeight - margin * 2)

        const imgAspect = embeddedImg.width / embeddedImg.height
        const availAspect = availW / availH

        let drawW = availW
        let drawH = availH

        if (imgAspect > availAspect) {
          drawH = availW / imgAspect
        } else {
          drawW = availH * imgAspect
        }

        const drawX = margin + (availW - drawW) / 2
        const drawY = margin + (availH - drawH) / 2

        page.drawImage(embeddedImg, {
          x: drawX,
          y: drawY,
          width: drawW,
          height: drawH,
        })
      }

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes], { type: "application/pdf" })
      setOutputBlob(blob)
      toast.success("Images converted to PDF successfully!")
    } catch {
      toast.error("Failed to convert images to PDF.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-5">
        <div>
          <h3 className="font-semibold text-sm">Convert Images to PDF ({items.length} images)</h3>
          <p className="text-xs text-muted-foreground">Select multiple PNG, JPG or WebP images to compile into a PDF</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
            <span className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors">
              <Plus className="size-4 mr-1.5" /> Add Images
            </span>
          </label>
          {items.length > 0 && (
            <Button size="sm" variant="ghost" onClick={resetAll}>
              <RotateCcw className="size-4 mr-1.5" /> Reset
            </Button>
          )}
        </div>
      </div>

      {items.length > 0 && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Controls */}
          <div className="space-y-4 rounded-xl border border-border bg-card p-5">
            <h4 className="font-medium text-sm border-b border-border pb-2">PDF Document Settings</h4>

            <div className="space-y-1.5">
              <Label className="text-xs">Page Size</Label>
              <Select value={pageSize} onValueChange={(v: any) => setPageSize(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a4">A4 (Standard)</SelectItem>
                  <SelectItem value="letter">US Letter</SelectItem>
                  <SelectItem value="fit">Fit to Image Size</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {pageSize !== "fit" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Page Orientation</Label>
                <Select value={orientation} onValueChange={(v: any) => setOrientation(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">Portrait</SelectItem>
                    <SelectItem value="landscape">Landscape</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">Page Margin</Label>
              <Select value={String(margin)} onValueChange={(v: any) => setMargin(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No Margin (0pt)</SelectItem>
                  <SelectItem value="20">Small Margin (20pt)</SelectItem>
                  <SelectItem value="40">Large Margin (40pt)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={convertToPdf} disabled={loading} className="w-full">
              {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Generate PDF Document
            </Button>

            {outputBlob && (
              <Button
                onClick={() => downloadBlob(outputBlob, "images-combined.pdf")}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Download className="size-4 mr-2" /> Download PDF ({formatBytes(outputBlob.size)})
              </Button>
            )}
          </div>

          {/* List of Images */}
          <div className="md:col-span-2 space-y-3">
            <Label className="text-xs font-medium">Image Sequence ({items.length} files)</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="flex flex-col justify-between rounded-xl border border-border bg-card p-3 space-y-2"
                >
                  <div className="aspect-square flex items-center justify-center overflow-hidden rounded-lg bg-muted/40 p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.url} alt={item.file.name} className="max-h-full max-w-full object-contain" />
                  </div>

                  <span className="font-mono text-xs truncate">{item.file.name}</span>

                  <div className="flex items-center justify-between border-t border-border pt-2">
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 w-6 p-0"
                        disabled={index === 0}
                        onClick={() => moveItem(index, -1)}
                      >
                        <ArrowUp className="size-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 w-6 p-0"
                        disabled={index === items.length - 1}
                        onClick={() => moveItem(index, 1)}
                      >
                        <ArrowDown className="size-3" />
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-destructive"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
