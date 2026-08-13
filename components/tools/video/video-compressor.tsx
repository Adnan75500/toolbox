"use client"

import { useState, useRef } from "react"
import { Minimize2, Download, RotateCcw, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { FileDropzone } from "@/components/file-dropzone"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { downloadBlob, formatBytes } from "@/lib/download"

export default function VideoCompressor() {
  const [file, setFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [resolution, setResolution] = useState<"720" | "480" | "360" | "240">("480")
  const [quality, setQuality] = useState<"low" | "medium" | "high">("medium")
  const [processing, setProcessing] = useState<boolean>(false)

  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null)
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  function reset() {
    if (videoUrl) URL.revokeObjectURL(videoUrl)
    if (compressedUrl) URL.revokeObjectURL(compressedUrl)
    setFile(null)
    setVideoUrl(null)
    setCompressedBlob(null)
    setCompressedUrl(null)
    setProcessing(false)
  }

  function onFiles(files: File[]) {
    const f = files[0]
    if (!f.type.startsWith("video/")) {
      toast.error("Please upload a valid video file.")
      return
    }
    reset()
    setFile(f)
    setVideoUrl(URL.createObjectURL(f))
  }

  async function compressVideo() {
    if (!videoRef.current || !videoUrl) return
    setProcessing(true)
    setCompressedBlob(null)

    try {
      const video = videoRef.current
      video.currentTime = 0
      await new Promise((r) => setTimeout(r, 200))

      const targetH = Number(resolution)
      const aspect = (video.videoWidth || 640) / (video.videoHeight || 360)
      const targetW = Math.round(targetH * aspect)

      const canvas = document.createElement("canvas")
      canvas.width = targetW
      canvas.height = targetH
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      let bps = 1000000 // 1 Mbps medium
      if (quality === "low") bps = 500000 // 500 Kbps
      else if (quality === "high") bps = 2500000 // 2.5 Mbps

      const stream = canvas.captureStream(24)
      const recorder = new MediaRecorder(stream, {
        mimeType: "video/webm",
        bitsPerSecond: bps,
      })
      const chunks: BlobPart[] = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" })
        setCompressedBlob(blob)
        if (compressedUrl) URL.revokeObjectURL(compressedUrl)
        setCompressedUrl(URL.createObjectURL(blob))
        setProcessing(false)
        toast.success("Video compressed successfully!")
      }

      recorder.start()
      video.play()

      const checkEnd = setInterval(() => {
        ctx.drawImage(video, 0, 0, targetW, targetH)
        if (video.ended || video.paused) {
          clearInterval(checkEnd)
          recorder.stop()
        }
      }, 1000 / 24)
    } catch {
      toast.error("An error occurred during video compression.")
      setProcessing(false)
    }
  }

  if (!file) {
    return (
      <FileDropzone
        accept="video/*"
        onFiles={onFiles}
        label="Drop a video file to reduce resolution & size"
        hint="MP4, WebM, MOV, AVI — Processed 100% locally in your browser"
      />
    )
  }

  const savings =
    compressedBlob && file.size > 0
      ? Math.max(0, Math.round((1 - compressedBlob.size / file.size) * 100))
      : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-5">
        <div>
          <h3 className="font-semibold text-sm">{file.name}</h3>
          <p className="text-xs text-muted-foreground">Original File Size: {formatBytes(file.size)}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={reset}>
          <RotateCcw className="size-4 mr-1.5" /> Start Over
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Controls */}
        <div className="space-y-5 rounded-xl border border-border bg-card p-5">
          <div className="aspect-video relative overflow-hidden rounded-xl bg-black hidden">
            {videoUrl && <video ref={videoRef} src={videoUrl} className="w-full h-full object-contain" />}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Target Resolution</Label>
            <Select value={resolution} onValueChange={(v: any) => setResolution(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="720">720p HD</SelectItem>
                <SelectItem value="480">480p Standard</SelectItem>
                <SelectItem value="360">360p Low</SelectItem>
                <SelectItem value="240">240p Compact</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Compression Bitrate / Quality</Label>
            <Select value={quality} onValueChange={(v: any) => setQuality(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low (Maximum Compression)</SelectItem>
                <SelectItem value="medium">Medium (Balanced)</SelectItem>
                <SelectItem value="high">High Quality</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={compressVideo} disabled={processing} className="w-full">
            {processing ? <Loader2 className="size-4 animate-spin mr-2" /> : <Minimize2 className="size-4 mr-2" />}
            {processing ? "Compressing Video..." : "Compress Video Now"}
          </Button>
        </div>

        {/* Output */}
        <div className="space-y-4">
          <div className="aspect-video flex items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/30 p-2">
            {compressedUrl ? (
              <video src={compressedUrl} controls className="max-h-full max-w-full object-contain rounded-lg shadow-xs" />
            ) : (
              <span className="text-xs text-muted-foreground">Compressed video preview will appear here</span>
            )}
          </div>

          {compressedBlob && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
              <div className="flex justify-between items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span>Compressed Size: {formatBytes(compressedBlob.size)}</span>
                <span>{savings > 0 ? `−${savings}% smaller` : "Optimized"}</span>
              </div>
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => downloadBlob(compressedBlob, `compressed-${file.name.replace(/\.[^/.]+$/, "")}.webm`)}
              >
                <Download className="size-4 mr-2" /> Download Compressed Video
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
