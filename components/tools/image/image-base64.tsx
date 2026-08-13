"use client"

import { useState } from "react"
import { Copy, Download, Check, FileCode, Code, Image as ImageIcon, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { FileDropzone } from "@/components/file-dropzone"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { downloadBlob, formatBytes } from "@/lib/download"
import { readFileAsDataURL } from "@/lib/image"

export default function ImageBase64() {
  const [tab, setTab] = useState<"encode" | "decode">("encode")

  // Encode State
  const [file, setFile] = useState<File | null>(null)
  const [base64Data, setBase64Data] = useState<string>("")
  const [copiedType, setCopiedType] = useState<string | null>(null)

  // Decode State
  const [decodeInput, setDecodeInput] = useState<string>("")
  const [decodeFormat, setDecodeFormat] = useState<"png" | "jpeg" | "webp">("png")

  async function onFileDrop(files: File[]) {
    const f = files[0]
    if (!f.type.startsWith("image/")) {
      toast.error("Please choose a valid image file.")
      return
    }
    setFile(f)
    try {
      const dataUrl = await readFileAsDataURL(f)
      setBase64Data(dataUrl)
    } catch {
      toast.error("Failed to read image file as Base64.")
    }
  }

  function resetEncode() {
    setFile(null)
    setBase64Data("")
    setCopiedType(null)
  }

  function copyToClipboard(text: string, type: string) {
    navigator.clipboard.writeText(text)
    setCopiedType(type)
    toast.success(`Copied ${type} to clipboard!`)
    setTimeout(() => setCopiedType(null), 2000)
  }

  const rawBase64 = base64Data ? base64Data.split(",")[1] || "" : ""
  const htmlSnippet = base64Data ? `<img src="${base64Data}" alt="Base64 Image" />` : ""
  const cssSnippet = base64Data ? `background-image: url('${base64Data}');` : ""

  // Decode helper: convert Data URL or raw Base64 string to Blob
  function handleDecodeDownload() {
    let cleanInput = decodeInput.trim()
    if (!cleanInput) {
      toast.error("Please paste a Base64 string or Data URL first.")
      return
    }

    if (!cleanInput.startsWith("data:")) {
      cleanInput = `data:image/${decodeFormat};base64,${cleanInput}`
    }

    try {
      const parts = cleanInput.split(",")
      const mime = parts[0].match(/:(.*?);/)?.[1] || `image/${decodeFormat}`
      const bstr = atob(parts[1] || parts[0])
      let n = bstr.length
      const u8arr = new Uint8Array(n)
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n)
      }
      const blob = new Blob([u8arr], { type: mime })
      downloadBlob(blob, `decoded-image.${decodeFormat}`)
      toast.success("Image downloaded successfully!")
    } catch {
      toast.error("Invalid Base64 string format. Please verify string.")
    }
  }

  return (
    <div className="space-y-6">
      <Tabs value={tab} onValueChange={(v: any) => setTab(v)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-6">
          <TabsTrigger value="encode" className="flex items-center gap-2">
            <FileCode className="size-4" /> Image to Base64
          </TabsTrigger>
          <TabsTrigger value="decode" className="flex items-center gap-2">
            <ImageIcon className="size-4" /> Base64 to Image
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: ENCODE */}
        <TabsContent value="encode" className="space-y-6">
          {!file ? (
            <FileDropzone
              accept="image/*"
              onFiles={onFileDrop}
              label="Drop an image to convert to Base64"
              hint="JPG, PNG, WebP, GIF, SVG — Processed 100% locally on your machine"
            />
          ) : (
            <div className="space-y-6">
              {/* Header Stats */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-5">
                <div>
                  <h3 className="font-semibold text-sm">{file.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    Original Size: <span className="font-mono text-foreground">{formatBytes(file.size)}</span> • Base64 Length:{" "}
                    <span className="font-mono text-foreground">{base64Data.length.toLocaleString()} chars</span>
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={resetEncode}>
                  <RotateCcw className="size-4 mr-1.5" /> Convert Another
                </Button>
              </div>

              {/* Grid: Preview & Code Outputs */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Image Preview */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Image Preview</Label>
                  <div className="aspect-square flex items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/30 p-4">
                    {base64Data && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={base64Data} alt="Preview" className="max-h-full max-w-full object-contain" />
                    )}
                  </div>
                </div>

                {/* Code Outputs */}
                <div className="space-y-4">
                  {/* Full Data URL */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-medium">
                      <span>Data URL (src)</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => copyToClipboard(base64Data, "Data URL")}
                      >
                        {copiedType === "Data URL" ? <Check className="size-3 mr-1 text-emerald-500" /> : <Copy className="size-3 mr-1" />}
                        Copy Data URL
                      </Button>
                    </div>
                    <Textarea value={base64Data} readOnly className="font-mono text-xs h-24 resize-none bg-muted/20" />
                  </div>

                  {/* HTML Tag Snippet */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-medium">
                      <span className="flex items-center gap-1"><Code className="size-3.5" /> HTML Image Tag</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => copyToClipboard(htmlSnippet, "HTML Snippet")}
                      >
                        {copiedType === "HTML Snippet" ? <Check className="size-3 mr-1 text-emerald-500" /> : <Copy className="size-3 mr-1" />}
                        Copy HTML
                      </Button>
                    </div>
                    <Textarea value={htmlSnippet} readOnly className="font-mono text-xs h-16 resize-none bg-muted/20" />
                  </div>

                  {/* CSS Background Snippet */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-medium">
                      <span>CSS Background Image</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => copyToClipboard(cssSnippet, "CSS Snippet")}
                      >
                        {copiedType === "CSS Snippet" ? <Check className="size-3 mr-1 text-emerald-500" /> : <Copy className="size-3 mr-1" />}
                        Copy CSS
                      </Button>
                    </div>
                    <Textarea value={cssSnippet} readOnly className="font-mono text-xs h-16 resize-none bg-muted/20" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* TAB 2: DECODE */}
        <TabsContent value="decode" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Input Side */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Paste Base64 String or Data URL</Label>
                <Textarea
                  placeholder="Paste data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
                  value={decodeInput}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDecodeInput(e.target.value)}
                  className="font-mono text-xs h-60 resize-y"
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Output Format:</Label>
                  <Select value={decodeFormat} onValueChange={(v: any) => setDecodeFormat(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="png">PNG</SelectItem>
                      <SelectItem value="jpeg">JPG</SelectItem>
                      <SelectItem value="webp">WebP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button className="mt-5" onClick={handleDecodeDownload} disabled={!decodeInput.trim()}>
                  <Download className="size-4 mr-2" /> Download Image
                </Button>
              </div>
            </div>

            {/* Live Preview Side */}
            <div className="space-y-2">
              <Label>Decoded Image Preview</Label>
              <div className="aspect-square flex items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/30 p-4">
                {decodeInput.trim() ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={
                      decodeInput.trim().startsWith("data:")
                        ? decodeInput.trim()
                        : `data:image/${decodeFormat};base64,${decodeInput.trim()}`
                    }
                    alt="Decoded"
                    className="max-h-full max-w-full object-contain"
                    onError={() => {
                      // Silently handle invalid preview
                    }}
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">Paste a Base64 string to see preview</span>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
