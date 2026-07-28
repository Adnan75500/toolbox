"use client"

import { useCallback, useEffect, useState } from "react"

const STORAGE_KEY = "toolbox:recent-tools"
const MAX_RECENT = 6

function read(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : []
  } catch {
    return []
  }
}

export function useRecentTools() {
  const [recent, setRecent] = useState<string[]>([])

  useEffect(() => {
    setRecent(read())
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setRecent(read())
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  const addRecent = useCallback((slug: string) => {
    setRecent((prev) => {
      const next = [slug, ...prev.filter((s) => s !== slug)].slice(0, MAX_RECENT)
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // ignore write errors (private mode, quota)
      }
      return next
    })
  }, [])

  return { recent, addRecent }
}

export function trackToolVisit(slug: string) {
  if (typeof window === "undefined") return
  try {
    const current = read()
    const next = [slug, ...current.filter((s) => s !== slug)].slice(0, MAX_RECENT)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // ignore
  }
}
