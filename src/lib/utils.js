import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const STORAGE_BASE = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000').replace(/\/api$/, '')

export function assetUrl(path) {
  if (!path) return null
  if (path.startsWith('http')) {
    const url = new URL(path)
    // Only re-point URLs under our own /storage path (the host can differ per
    // environment). Leave external URLs (e.g. Google avatars) fully intact.
    if (url.pathname.startsWith('/storage/')) return STORAGE_BASE + url.pathname
    return path
  }
  if (path.startsWith('/storage/') || path.startsWith('storage/')) {
    return STORAGE_BASE + '/' + path.replace(/^\//, '')
  }
  const slash = path.startsWith('/') ? '' : '/'
  return STORAGE_BASE + '/storage' + slash + path
}

export function formatDistanceToNow(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now - date) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return date.toLocaleDateString()
}
