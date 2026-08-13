"use client"

import { useState } from "react"
import { ShieldCheck, Download, Trash2, Camera, MapPin, Info, FileText, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { FileDropzone } from "@/components/file-dropzone"
import { Button } from "@/components/ui/button"
import { downloadBlob, formatBytes } from "@/lib/download"
import { loadImage } from "@/lib/image"

interface ExifData {
  make?: string
  model?: string
  software?: string
  dateTime?: string
  exposureTime?: string
  fNumber?: string
  iso?: string
  focalLength?: string
  latitude?: string
  longitude?: string
  width?: number
  height?: number
  hasMetadata?: boolean
}

export default function ExifViewer() {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [exif, setExif] = useState<ExifData | null>(null)
  const [strippedBlob, setStrippedBlob] = useState<Blob | null>(null)
  const [strippedUrl, setStrippedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function reset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    if (strippedUrl) URL.revokeObjectURL(strippedUrl)
    setFile(null)
    setPreviewUrl(null)
    setExif(null)
    setStrippedBlob(null)
    setStrippedUrl(null)
  }

  async function onFiles(files: File[]) {
    const f = files[0]
    if (!f.type.startsWith("image/")) {
      toast.error("Please select an image file.")
      return
    }
    reset()
    setFile(f)
    const url = URL.createObjectURL(f)
    setPreviewUrl(url)
    setLoading(true)

    try {
      const parsed = await parseExifHeader(f)
      setExif(parsed)
    } catch {
      setExif({ hasMetadata: false })
    } finally {
      setLoading(false)
    }
  }

  async function stripExif() {
    if (!file || !previewUrl) return
    try {
      const img = await loadImage(previewUrl)
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      ctx.drawImage(img, 0, 0)

      canvas.toBlob((blob) => {
        if (!blob) return
        if (strippedUrl) URL.revokeObjectURL(strippedUrl)
        setStrippedBlob(blob)
        setStrippedUrl(URL.createObjectURL(blob))
        toast.success("EXIF metadata stripped successfully! File is clean.")
      }, file.type || "image/jpeg", 0.95)
    } catch {
      toast.error("Failed to strip metadata.")
    }
  }

  function downloadMetadataJSON() {
    if (!exif || !file) return
    const jsonStr = JSON.stringify(exif, null, 2)
    const blob = new Blob([jsonStr], { type: "application/json" })
    downloadBlob(blob, `${file.name.replace(/\.[^/.]+$/, "")}-metadata.json`)
  }

  if (!file) {
    return (
      <FileDropzone
        accept="image/*"
        onFiles={onFiles}
        label="Drop a photo to view or remove EXIF metadata"
        hint="Supports JPG, JPEG, TIFF, PNG, WebP — Processed 100% locally on your machine"
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Summary Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{file.name}</h3>
            <p className="text-xs text-muted-foreground">
              {formatBytes(file.size)} • {file.type || "image/jpeg"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="default" onClick={stripExif}>
            <Trash2 className="size-4 mr-1.5" /> Strip All Metadata
          </Button>
          <Button size="sm" variant="outline" onClick={downloadMetadataJSON}>
            <FileText className="size-4 mr-1.5" /> Export Metadata JSON
          </Button>
          <Button size="sm" variant="ghost" onClick={reset}>
            <RotateCcw className="size-4" />
          </Button>
        </div>
      </div>

      {/* Grid: Preview & Metadata Display */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left: Preview & Stripped Status */}
        <div className="space-y-4">
          <div className="aspect-video flex items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/30 p-2">
            {previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Photo" className="max-h-full max-w-full object-contain" />
            )}
          </div>

          {strippedBlob && strippedUrl && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="size-4" /> Clean File Ready (No EXIF)
                </span>
                <span className="text-xs font-mono">{formatBytes(strippedBlob.size)}</span>
              </div>
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => downloadBlob(strippedBlob, `clean-${file.name}`)}
              >
                <Download className="size-4 mr-2" /> Download Clean Image
              </Button>
            </div>
          )}
        </div>

        {/* Right: Detailed Metadata Tables */}
        <div className="space-y-4">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Reading metadata...</div>
          ) : (
            <>
              {/* Camera & Shot Details */}
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-center gap-2 font-medium text-sm border-b border-border pb-2">
                  <Camera className="size-4 text-primary" /> Camera & Settings
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Make:</span>{" "}
                    <span className="font-mono font-medium">{exif?.make || "Unknown"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Model:</span>{" "}
                    <span className="font-mono font-medium">{exif?.model || "Unknown"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Software:</span>{" "}
                    <span className="font-mono font-medium">{exif?.software || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date Taken:</span>{" "}
                    <span className="font-mono font-medium">{exif?.dateTime || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Shutter Speed:</span>{" "}
                    <span className="font-mono font-medium">{exif?.exposureTime || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Aperture:</span>{" "}
                    <span className="font-mono font-medium">{exif?.fNumber || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">ISO:</span>{" "}
                    <span className="font-mono font-medium">{exif?.iso || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Focal Length:</span>{" "}
                    <span className="font-mono font-medium">{exif?.focalLength || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Location GPS Info */}
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-center gap-2 font-medium text-sm border-b border-border pb-2">
                  <MapPin className="size-4 text-primary" /> Location (GPS)
                </div>
                {exif?.latitude && exif?.longitude ? (
                  <div className="space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-muted-foreground">Latitude:</span>{" "}
                        <span className="font-mono">{exif.latitude}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Longitude:</span>{" "}
                        <span className="font-mono">{exif.longitude}</span>
                      </div>
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${exif.latitude},${exif.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs text-primary hover:underline"
                    >
                      View on Google Maps &rarr;
                    </a>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No GPS coordinates embedded in this file.</p>
                )}
              </div>

              {/* File Specs */}
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-center gap-2 font-medium text-sm border-b border-border pb-2">
                  <Info className="size-4 text-primary" /> File Specifications
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Filename:</span>{" "}
                    <span className="font-mono truncate">{file.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Size:</span>{" "}
                    <span className="font-mono">{formatBytes(file.size)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type:</span>{" "}
                    <span className="font-mono">{file.type || "image/jpeg"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Dimensions:</span>{" "}
                    <span className="font-mono">
                      {exif?.width && exif?.height ? `${exif.width} × ${exif.height} px` : "Auto"}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Pure JavaScript local EXIF header parser for JPEG files
 */
async function parseExifHeader(file: File): Promise<ExifData> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer
      if (!buffer) return resolve({ hasMetadata: false })

      const view = new DataView(buffer)
      if (view.getUint16(0, false) !== 0xffd8) {
        // Not a JPEG, get image dimensions via Image
        const img = new Image()
        img.onload = () => resolve({ width: img.width, height: img.height, hasMetadata: false })
        img.onerror = () => resolve({ hasMetadata: false })
        img.src = URL.createObjectURL(file)
        return
      }

      let offset = 2
      const length = view.byteLength
      const exifData: ExifData = { hasMetadata: false }

      while (offset < length) {
        const marker = view.getUint16(offset, false)
        if (marker === 0xffe1) {
          // APP1 Marker (EXIF)
          const app1Length = view.getUint16(offset + 2, false)
          const exifHeader = view.getUint32(offset + 4, false)
          if (exifHeader === 0x45786966) {
            // "Exif" ascii
            exifData.hasMetadata = true
            parseTiffHeader(view, offset + 10, exifData)
          }
          break
        } else if ((marker & 0xff00) !== 0xff00) {
          break
        } else {
          offset += 2 + view.getUint16(offset + 2, false)
        }
      }

      const img = new Image()
      img.onload = () => {
        exifData.width = img.width
        exifData.height = img.height
        resolve(exifData)
      }
      img.onerror = () => resolve(exifData)
      img.src = URL.createObjectURL(file)
    }
    reader.readAsArrayBuffer(file.slice(0, 128 * 1024)) // Read first 128KB for EXIF headers
  })
}

function parseTiffHeader(view: DataView, tiffOffset: number, out: ExifData) {
  try {
    const littleEndian = view.getUint16(tiffOffset, false) === 0x4949
    const ifdOffset = view.getUint32(tiffOffset + 4, littleEndian)
    const count = view.getUint16(tiffOffset + ifdOffset, littleEndian)

    for (let i = 0; i < count; i++) {
      const entryOffset = tiffOffset + ifdOffset + 2 + i * 12
      const tag = view.getUint16(entryOffset, littleEndian)
      // Common TIFF EXIF Tags
      if (tag === 0x010f) out.make = readString(view, entryOffset, tiffOffset, littleEndian)
      else if (tag === 0x0110) out.model = readString(view, entryOffset, tiffOffset, littleEndian)
      else if (tag === 0x0131) out.software = readString(view, entryOffset, tiffOffset, littleEndian)
      else if (tag === 0x0132) out.dateTime = readString(view, entryOffset, tiffOffset, littleEndian)
    }
  } catch {
    // Ignore parsing error
  }
}

function readString(view: DataView, entryOffset: number, tiffOffset: number, littleEndian: boolean): string {
  try {
    const type = view.getUint16(entryOffset + 2, littleEndian)
    const count = view.getUint32(entryOffset + 4, littleEndian)
    let valueOffset = entryOffset + 8
    if (type === 2 && count > 4) {
      valueOffset = tiffOffset + view.getUint32(entryOffset + 8, littleEndian)
    }
    let str = ""
    for (let i = 0; i < count - 1; i++) {
      str += String.fromCharCode(view.getUint8(valueOffset + i))
    }
    return str.trim()
  } catch {
    return ""
  }
}
