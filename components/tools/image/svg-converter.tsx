"use client"

import { useState, useCallback, useEffect } from "react"
import { FileCode, Download, Code, Image as ImageIcon, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { FileDropzone } from "@/components/file-dropzone"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { downloadBlob, formatBytes } from "@/lib/download"
import { loadImage, readFileAsDataURL } from "@/lib/image"

export default function SvgConverter() {
  const [tab, setTab] = useState<"svg-to-raster" | "raster-to-svg">("svg-to-raster")

  // TAB 1 STATE: SVG -> RASTER
  const [svgContent, setSvgContent] = useState<string>("")
  const [svgFileName, setSvgFileName] = useState<string>("vector.svg")
  const [width, setWidth] = useState<number>(1024)
  const [height, setHeight] = useState<number>(1024)
  const [format, setFormat] = useState<"png" | "jpeg" | "webp">("png")
  const [bgMode, setBgMode] = useState<"transparent" | "white" | "black">("transparent")
  const [rasterUrl, setRasterUrl] = useState<string | null>(null)
  const [rasterBlob, setRasterBlob] = useState<Blob | null>(null)

  // TAB 2 STATE: RASTER -> SVG
  const [rasterFile, setRasterFile] = useState<File | null>(null)
  const [rasterDataUrl, setRasterDataUrl] = useState<string>("")
  const [svgOutputCode, setSvgOutputCode] = useState<string>("")

  function onSvgFileDrop(files: File[]) {
    const f = files[0]
    setSvgFileName(f.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setSvgContent(text)
    }
    reader.readAsText(f)
  }

  const renderSvgToRaster = useCallback(async () => {
    if (!svgContent.trim()) {
      setRasterUrl(null)
      setRasterBlob(null)
      return
    }

    try {
      const svgBlob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" })
      const url = URL.createObjectURL(svgBlob)
      const img = await loadImage(url)

      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      if (bgMode === "white") {
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, width, height)
      } else if (bgMode === "black") {
        ctx.fillStyle = "#000000"
        ctx.fillRect(0, 0, width, height)
      } else {
        ctx.clearRect(0, 0, width, height)
      }

      ctx.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)

      const mime = `image/${format}`
      canvas.toBlob((blob) => {
        if (!blob) return
        if (rasterUrl) URL.revokeObjectURL(rasterUrl)
        setRasterBlob(blob)
        setRasterUrl(URL.createObjectURL(blob))
      }, mime, 0.95)
    } catch {
      // Ignore conversion error
    }
  }, [svgContent, width, height, format, bgMode, rasterUrl])

  useEffect(() => {
    renderSvgToRaster()
  }, [renderSvgToRaster])

  // Raster to SVG logic
  async function onRasterFileDrop(files: File[]) {
    const f = files[0]
    if (!f.type.startsWith("image/")) {
      toast.error("Please choose a PNG, JPG or WebP image.")
      return
    }
    setRasterFile(f)
    const dataUrl = await readFileAsDataURL(f)
    setRasterDataUrl(dataUrl)

    const img = await loadImage(dataUrl)
    const svgWrapper = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${img.width} ${img.height}" width="${img.width}" height="${img.height}">
  <!-- Generated locally by Toolbox -->
  <image href="${dataUrl}" x="0" y="0" width="${img.width}" height="${img.height}" />
</svg>`
    setSvgOutputCode(svgWrapper)
  }

  function downloadSvgFile() {
    if (!svgOutputCode || !rasterFile) return
    const blob = new Blob([svgOutputCode], { type: "image/svg+xml" })
    downloadBlob(blob, `${rasterFile.name.replace(/\.[^/.]+$/, "")}.svg`)
    toast.success("SVG file downloaded!")
  }

  return (
    <div className="space-y-6">
      <Tabs value={tab} onValueChange={(v: any) => setTab(v)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-6">
          <TabsTrigger value="svg-to-raster" className="flex items-center gap-2">
            <FileCode className="size-4" /> SVG to PNG / JPG
          </TabsTrigger>
          <TabsTrigger value="raster-to-svg" className="flex items-center gap-2">
            <Code className="size-4" /> PNG / JPG to SVG
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: SVG TO RASTER */}
        <TabsContent value="svg-to-raster" className="space-y-6">
          {!svgContent ? (
            <FileDropzone
              accept=".svg,image/svg+xml"
              onFiles={onSvgFileDrop}
              label="Drop an SVG vector file to convert to PNG/JPG"
              hint="Vector to raster renderer — Processed 100% locally in browser"
            />
          ) : (
            <div className="space-y-6">
              {/* Configuration Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full sm:w-auto">
                  <div className="space-y-1">
                    <Label className="text-xs">Width (px)</Label>
                    <Input
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(Number(e.target.value) || 512)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Height (px)</Label>
                    <Input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(Number(e.target.value) || 512)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Background</Label>
                    <Select value={bgMode} onValueChange={(v: any) => setBgMode(v)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="transparent">Transparent</SelectItem>
                        <SelectItem value="white">White</SelectItem>
                        <SelectItem value="black">Black</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Format</Label>
                    <Select value={format} onValueChange={(v: any) => setFormat(v)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="png">PNG</SelectItem>
                        <SelectItem value="jpeg">JPG</SelectItem>
                        <SelectItem value="webp">WebP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button variant="ghost" size="sm" onClick={() => setSvgContent("")}>
                  <RotateCcw className="size-4 mr-1.5" /> Start Over
                </Button>
              </div>

              {/* Grid: Code Textarea vs Rendered Preview */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">SVG Markup Code</Label>
                  <Textarea
                    value={svgContent}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSvgContent(e.target.value)}
                    className="font-mono text-xs h-80 resize-y"
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-xs font-medium">Rasterized Output ({width} × {height} px)</Label>
                  <div className="aspect-square flex items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/30 p-4">
                    {rasterUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={rasterUrl} alt="Raster preview" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="text-xs text-muted-foreground">Rendering...</span>
                    )}
                  </div>

                  {rasterBlob && (
                    <Button
                      className="w-full"
                      onClick={() => downloadBlob(rasterBlob, `${svgFileName.replace(/\.[^/.]+$/, "")}.${format}`)}
                    >
                      <Download className="size-4 mr-2" /> Download {format.toUpperCase()} Image ({formatBytes(rasterBlob.size)})
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* TAB 2: RASTER TO SVG */}
        <TabsContent value="raster-to-svg" className="space-y-6">
          {!rasterFile ? (
            <FileDropzone
              accept="image/png,image/jpeg,image/webp"
              onFiles={onRasterFileDrop}
              label="Drop a PNG/JPG photo to wrap into SVG"
              hint="Creates standalone clean vector SVG document"
            />
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-5">
                <div>
                  <h3 className="font-semibold text-sm">{rasterFile.name}</h3>
                  <p className="text-xs text-muted-foreground">{formatBytes(rasterFile.size)} • {rasterFile.type}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setRasterFile(null)}>
                  <RotateCcw className="size-4 mr-1.5" /> Convert Another
                </Button>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Image Preview</Label>
                  <div className="aspect-square flex items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/30 p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={rasterDataUrl} alt="Target" className="max-h-full max-w-full object-contain" />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-xs font-medium">Generated SVG Code</Label>
                  <Textarea value={svgOutputCode} readOnly className="font-mono text-xs h-64 resize-none bg-muted/20" />
                  <Button className="w-full" onClick={downloadSvgFile}>
                    <Download className="size-4 mr-2" /> Download .SVG Document
                  </Button>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
