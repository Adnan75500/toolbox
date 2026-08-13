"use client"

import { useState, useRef } from "react"
import { RefreshCw, Download, RotateCcw, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { FileDropzone } from "@/components/file-dropzone"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { downloadBlob, formatBytes } from "@/lib/download"

export default function VideoConverter() {
  const [file, setFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [targetFormat, setTargetFormat] = useState<"webm" | "mp4">("webm")
  const [processing, setProcessing] = useState<boolean>(false)

  const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null)
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  function reset() {
    if (videoUrl) URL.revokeObjectURL(videoUrl)
    if (convertedUrl) URL.revokeObjectURL(convertedUrl)
    setFile(null)
    setVideoUrl(null)
    setConvertedBlob(null)
    setConvertedUrl(null)
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

  async function convertVideo() {
    if (!videoRef.current || !videoUrl) return
    setProcessing(true)
    setConvertedBlob(null)

    try {
      const video = videoRef.current
      video.currentTime = 0
      await new Promise((r) => setTimeout(r, 200))

      const canvas = document.createElement("canvas")
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 360
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const mime = targetFormat === "mp4" ? "video/mp4" : "video/webm"
      const mimeType = MediaRecorder.isTypeSupported(mime) ? mime : "video/webm"

      const stream = canvas.captureStream(30)
      const recorder = new MediaRecorder(stream, { mimeType })
      const chunks: BlobPart[] = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType })
        setConvertedBlob(blob)
        if (convertedUrl) URL.revokeObjectURL(convertedUrl)
        setConvertedUrl(URL.createObjectURL(blob))
        setProcessing(false)
        toast.success(`Video converted to ${targetFormat.toUpperCase()}!`)
      }

      recorder.start()
      video.play()

      const checkEnd = setInterval(() => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        if (video.ended || video.paused) {
          clearInterval(checkEnd)
          recorder.stop()
        }
      }, 1000 / 30)
    } catch {
      toast.error("Failed to convert video file.")
      setProcessing(false)
    }
  }

  if (!file) {
    return (
      <FileDropzone
        accept="video/*"
        onFiles={onFiles}
        label="Drop a video file to convert formats"
        hint="Supports MP4, WebM, MOV, AVI — Processed 100% locally in your browser"
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-5">
        <div>
          <h3 className="font-semibold text-sm">{file.name}</h3>
          <p className="text-xs text-muted-foreground">{formatBytes(file.size)} • {file.type}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={reset}>
          <RotateCcw className="size-4 mr-1.5" /> Start Over
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-5 rounded-xl border border-border bg-card p-5">
          <div className="aspect-video relative overflow-hidden rounded-xl bg-black hidden">
            {videoUrl && <video ref={videoRef} src={videoUrl} className="w-full h-full object-contain" />}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Target Format</Label>
            <Select value={targetFormat} onValueChange={(v: any) => setTargetFormat(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="webm">WebM Video (.webm)</SelectItem>
                <SelectItem value="mp4">MP4 Video (.mp4)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={convertVideo} disabled={processing} className="w-full">
            {processing ? <Loader2 className="size-4 animate-spin mr-2" /> : <RefreshCw className="size-4 mr-2" />}
            {processing ? "Converting Video..." : "Convert Video Format"}
          </Button>
        </div>

        <div className="space-y-4">
          <div className="aspect-video flex items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/30 p-2">
            {convertedUrl ? (
              <video src={convertedUrl} controls className="max-h-full max-w-full object-contain rounded-lg shadow-xs" />
            ) : (
              <span className="text-xs text-muted-foreground">Converted video output preview will appear here</span>
            )}
          </div>

          {convertedBlob && (
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() =>
                downloadBlob(convertedBlob, `converted-${file.name.replace(/\.[^/.]+$/, "")}.${targetFormat}`)
              }
            >
              <Download className="size-4 mr-2" /> Download Converted Video ({formatBytes(convertedBlob.size)})
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
