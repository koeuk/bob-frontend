import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function assetUrl(path) {
  if (!path) return null
  if (path.startsWith('http')) {
    const url = new URL(path)
    return 'http://127.0.0.1:8001' + url.pathname
  }
  // Path already contains the /storage/ prefix — don't add it again
  if (path.startsWith('/storage/') || path.startsWith('storage/')) {
    return 'http://127.0.0.1:8001/' + path.replace(/^\//, '')
  }
  const slash = path.startsWith('/') ? '' : '/'
  return 'http://127.0.0.1:8001/storage' + slash + path
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
