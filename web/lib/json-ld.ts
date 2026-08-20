/**
 * Safely serialize a JSON-LD object for insertion into a <script type="application/ld+json"> tag.
 * Escapes < and > characters to prevent breaking out of the script context.
 *
 * Security invariant: The output MUST NOT contain unescaped </script> sequences.
 * This function replaces both < and > with their unicode escape sequences.
 */
export function safeJsonLd(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')
}
