export const resolveImageUrl = (path?: string) => {
  if (!path) return ''
  const raw = String(path).trim()
  if (!raw) return ''

  let normalized = raw
    .replace(/^https:\/\/https?:\/\//i, 'https://')
    .replace(/^http:\/\/https?:\/\//i, 'http://')
    .replace('.https//', '.')

  if (/^(https?:)?\/\//.test(normalized) || normalized.startsWith('data:') || normalized.startsWith('blob:')) {
    try {
      const url = new URL(normalized.startsWith('//') ? `https:${normalized}` : normalized)
      const parts = url.hostname.split('.')
      if (parts.length >= 2 && parts[0] === parts[1]) {
        parts.splice(1, 1)
        url.hostname = parts.join('.')
      }
      return url.toString()
    } catch {
      return normalized
    }
  }
  if (normalized.startsWith('/api/')) return normalized
  if (normalized.startsWith('/')) return `/api${normalized}`
  return `/api/${normalized}`
}
