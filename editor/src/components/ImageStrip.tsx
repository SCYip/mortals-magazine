/**
 * Small horizontal row of square image thumbnails for editor list views.
 * Pass image URLs (any falsy entries are skipped). Renders an "empty"
 * placeholder when there are no images, so callers don't need to guard.
 */

// Where the public site lives. Image URLs in our content are usually
// relative (e.g. `/images/foo.png`) because they're served by the main
// mortalsmag deploy. The editor lives on a different origin, so a
// relative `<img src>` would resolve to the editor's domain and
// Netlify's SPA fallback would hand back index.html instead of the
// image. We rewrite those paths to point at the public site.
const PUBLIC_SITE =
  (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined)?.replace(/\/$/, '') ||
  'https://mortalsmag.netlify.app'

/** Turn a possibly-relative image path into a fully-qualified URL. */
export function resolveImageUrl(url: string): string {
  if (!url) return url
  // Already absolute (Supabase storage public URLs, external CDNs, data:, blob:)
  if (/^(https?:|data:|blob:)/i.test(url)) return url
  // Protocol-relative
  if (url.startsWith('//')) return `https:${url}`
  // Site-rooted path → prefix with public site origin
  if (url.startsWith('/')) return `${PUBLIC_SITE}${url}`
  // Bare path (rare) — treat as site-rooted
  return `${PUBLIC_SITE}/${url}`
}

type Props = {
  images: (string | null | undefined)[]
  /** Override per-row aria label (e.g. "Cover + 2 inline"). Omit for default. */
  label?: string
  size?: number
}

export default function ImageStrip({ images, label, size = 40 }: Props) {
  const clean = images
    .filter((u): u is string => !!u && u.trim().length > 0)
    .map(resolveImageUrl)
  if (clean.length === 0) {
    return (
      <div className="strip strip--empty" aria-label="No images">
        <span className="strip__placeholder">No images</span>
      </div>
    )
  }
  return (
    <div className="strip" aria-label={label ?? `${clean.length} image${clean.length === 1 ? '' : 's'}`}>
      {clean.map((url, i) => (
        <a
          key={`${i}-${url}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="strip__thumb"
          title={url}
          style={{ width: size, height: size }}
        >
          <img src={url} alt="" loading="lazy" />
        </a>
      ))}
      <span className="strip__count">{clean.length}</span>
    </div>
  )
}

/**
 * Parse image URL references out of a rich-text content string.
 * Catches Markdown `![alt](url)`, HTML `<img src="...">`, and bare
 * `/images/...` or `http(s)://...` paths with an image extension.
 */
export function extractImagesFromContent(content: string | null | undefined): string[] {
  if (!content) return []
  const urls = new Set<string>()
  // Markdown: ![alt](url)
  for (const m of content.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) urls.add(m[1])
  // HTML <img src="...">
  for (const m of content.matchAll(/<img[^>]+src=["']([^"']+)["']/g)) urls.add(m[1])
  // Bare URLs ending in an image extension
  for (const m of content.matchAll(/(?:https?:\/\/\S+|\/images\/\S+)\.(?:jpe?g|png|gif|webp|avif|svg)/gi)) urls.add(m[0])
  return Array.from(urls)
}
