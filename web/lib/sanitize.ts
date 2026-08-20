import sanitize from 'sanitize-html'

/**
 * Sanitize HTML for rendering in `dangerouslySetInnerHTML`.
 *
 * Uses `sanitize-html` (DOM-free, htmlparser2-based) instead of a jsdom-backed
 * sanitizer: jsdom fails to load inside the Vercel serverless Node runtime on
 * the `/info/*` routes, taking the whole page down with a 500. This parser runs
 * anywhere Node runs.
 */
export function sanitizeHtml(html: string): string {
  return sanitize(html, {
    allowedTags: [
      'p',
      'br',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'a',
      'img',
      'ul',
      'ol',
      'li',
      'strong',
      'em',
      'b',
      'i',
      'blockquote',
      'pre',
      'code',
      'hr',
      'figure',
      'figcaption',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'span',
      'div',
    ],
    allowedAttributes: {
      '*': ['href', 'src', 'alt', 'title', 'class', 'width', 'height', 'loading'],
    },
  })
}
