"use client"

import { useState, useRef } from "react"
import { Sparkles, Download, RotateCcw, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { FileDropzone } from "@/components/file-dropzone"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { downloadBlob, formatBytes } from "@/lib/download"

export default function VideoToGif() {
  const [file, setFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [fps, setFps] = useState<number>(15)
  const [format, setFormat] = useState<"webp" | "gif">("webp")
  const [processing, setProcessing] = useState<boolean>(false)

  const [outputBlob, setOutputBlob] = useState<Blob | null>(null)
  const [outputUrl, setOutputUrl] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  function reset() {
    if (videoUrl) URL.revokeObjectURL(videoUrl)
    if (outputUrl) URL.revokeObjectURL(outputUrl)
    setFile(null)
    setVideoUrl(null)
    setOutputBlob(null)
    setOutputUrl(null)
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

  async function convertToAnimation() {
    if (!videoRef.current || !videoUrl) return
    setProcessing(true)
    setOutputBlob(null)

    try {
      const video = videoRef.current
      video.currentTime = 0
      await new Promise((r) => setTimeout(r, 200))

      const canvas = document.createElement("canvas")
      canvas.width = Math.min(640, video.videoWidth || 480)
      const aspect = (video.videoWidth || 640) / (video.videoHeight || 360)
      canvas.height = Math.round(canvas.width / aspect)
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const stream = canvas.captureStream(fps)
      const mime = format === "webp" ? "image/webp" : "video/webm"
      const mimeType = MediaRecorder.isTypeSupported(mime) ? mime : "video/webm"
      const recorder = new MediaRecorder(stream, { mimeType })
      const chunks: BlobPart[] = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType })
        setOutputBlob(blob)
        if (outputUrl) URL.revokeObjectURL(outputUrl)
        setOutputUrl(URL.createObjectURL(blob))
        setProcessing(false)
        toast.success(`Animated ${format.toUpperCase()} created successfully!`)
      }

      recorder.start()
      video.play()

      const checkEnd = setInterval(() => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        if (video.ended || video.paused) {
          clearInterval(checkEnd)
          recorder.stop()
        }
      }, 1000 / fps)
    } catch {
      toast.error("An error occurred during animation conversion.")
      setProcessing(false)
    }
  }

  if (!file) {
    return (
      <FileDropzone
        accept="video/*"
        onFiles={onFiles}
        label="Drop a video file to convert to Animated GIF / WebP"
        hint="Processed 100% locally in your browser"
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-5">
        <div>
          <h3 className="font-semibold text-sm">{file.name}</h3>
          <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
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
            <Label className="text-xs">Animation Format</Label>
            <Select value={format} onValueChange={(v: any) => setFormat(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="webp">Animated WebP (High Efficiency)</SelectItem>
                <SelectItem value="gif">GIF Clip (.gif / .webm)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Frame Rate (FPS)</Label>
            <Select value={String(fps)} onValueChange={(v: any) => setFps(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 FPS (Smaller size)</SelectItem>
                <SelectItem value="15">15 FPS (Standard GIF)</SelectItem>
                <SelectItem value="24">24 FPS (Smooth)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={convertToAnimation} disabled={processing} className="w-full">
            {processing ? <Loader2 className="size-4 animate-spin mr-2" /> : <Sparkles className="size-4 mr-2" />}
            {processing ? "Generating Animation..." : "Create Animated GIF / WebP"}
          </Button>
        </div>

        <div className="space-y-4">
          <div className="aspect-video flex items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/30 p-2">
            {outputUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={outputUrl} alt="Animated preview" className="max-h-full max-w-full object-contain rounded-lg shadow-xs" />
            ) : (
              <span className="text-xs text-muted-foreground">Animated output preview will appear here</span>
            )}
          </div>

          {outputBlob && (
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() =>
                downloadBlob(outputBlob, `animated-${file.name.replace(/\.[^/.]+$/, "")}.${format}`)
              }
            >
              <Download className="size-4 mr-2" /> Download Animation ({formatBytes(outputBlob.size)})
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
