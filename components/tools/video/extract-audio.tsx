"use client"

import { useState, useRef } from "react"
import { Music, Download, RotateCcw, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { FileDropzone } from "@/components/file-dropzone"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { downloadBlob, formatBytes } from "@/lib/download"

export default function ExtractAudio() {
  const [file, setFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [format, setFormat] = useState<"wav" | "webm">("wav")
  const [processing, setProcessing] = useState<boolean>(false)

  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  function reset() {
    if (videoUrl) URL.revokeObjectURL(videoUrl)
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setFile(null)
    setVideoUrl(null)
    setAudioBlob(null)
    setAudioUrl(null)
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

  async function extractAudioTrack() {
    if (!videoRef.current || !videoUrl) return
    setProcessing(true)
    setAudioBlob(null)

    try {
      const video = videoRef.current
      video.currentTime = 0
      await new Promise((r) => setTimeout(r, 200))

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const source = audioCtx.createMediaElementSource(video)
      const dest = audioCtx.createMediaStreamDestination()
      source.connect(dest)
      source.connect(audioCtx.destination)

      const recorder = new MediaRecorder(dest.stream)
      const chunks: BlobPart[] = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }

      recorder.onstop = async () => {
        const rawBlob = new Blob(chunks, { type: "audio/webm" })

        if (format === "wav") {
          // Convert audio buffer to WAV file bytes
          try {
            const arrayBuffer = await rawBlob.arrayBuffer()
            const decodedAudio = await audioCtx.decodeAudioData(arrayBuffer)
            const wavBlob = audioBufferToWavBlob(decodedAudio)
            setAudioBlob(wavBlob)
            if (audioUrl) URL.revokeObjectURL(audioUrl)
            setAudioUrl(URL.createObjectURL(wavBlob))
          } catch {
            setAudioBlob(rawBlob)
            if (audioUrl) URL.revokeObjectURL(audioUrl)
            setAudioUrl(URL.createObjectURL(rawBlob))
          }
        } else {
          setAudioBlob(rawBlob)
          if (audioUrl) URL.revokeObjectURL(audioUrl)
          setAudioUrl(URL.createObjectURL(rawBlob))
        }

        setProcessing(false)
        toast.success("Audio track extracted successfully!")
      }

      recorder.start()
      video.play()

      const checkEnd = setInterval(() => {
        if (video.ended || video.paused) {
          clearInterval(checkEnd)
          recorder.stop()
        }
      }, 300)
    } catch {
      toast.error("An error occurred while extracting audio.")
      setProcessing(false)
    }
  }

  if (!file) {
    return (
      <FileDropzone
        accept="video/*"
        onFiles={onFiles}
        label="Drop a video file to extract the audio track"
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
            <Label className="text-xs">Output Audio Format</Label>
            <Select value={format} onValueChange={(v: any) => setFormat(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wav">WAV (Lossless Audio)</SelectItem>
                <SelectItem value="webm">WebM Audio (.webm / .ogg)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={extractAudioTrack} disabled={processing} className="w-full">
            {processing ? <Loader2 className="size-4 animate-spin mr-2" /> : <Music className="size-4 mr-2" />}
            {processing ? "Extracting Audio..." : "Extract Audio Track"}
          </Button>
        </div>

        <div className="space-y-4">
          <div className="aspect-video flex items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/30 p-4">
            {audioUrl ? (
              <audio src={audioUrl} controls className="w-full" />
            ) : (
              <span className="text-xs text-muted-foreground">Extracted audio player will appear here</span>
            )}
          </div>

          {audioBlob && (
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() =>
                downloadBlob(audioBlob, `${file.name.replace(/\.[^/.]+$/, "")}-audio.${format}`)
              }
            >
              <Download className="size-4 mr-2" /> Download Audio File ({formatBytes(audioBlob.size)})
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const format = 1 // PCM
  const bitDepth = 16

  const samples = buffer.length
  const dataSize = samples * numChannels * (bitDepth / 8)
  const headerSize = 44
  const arrayBuffer = new ArrayBuffer(headerSize + dataSize)
  const view = new DataView(arrayBuffer)

  // Write WAV header
  writeString(view, 0, "RIFF")
  view.setUint32(4, 36 + dataSize, true)
  writeString(view, 8, "WAVE")
  writeString(view, 12, "fmt ")
  view.setUint32(16, 16, true)
  view.setUint16(20, format, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true)
  view.setUint16(32, numChannels * (bitDepth / 8), true)
  view.setUint16(34, bitDepth, true)
  writeString(view, 36, "data")
  view.setUint32(40, dataSize, true)

  // Write PCM data
  let offset = 44
  for (let i = 0; i < samples; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]))
      const s = sample < 0 ? sample * 0x8000 : sample * 0x7fff
      view.setInt16(offset, s, true)
      offset += 2
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" })
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}
