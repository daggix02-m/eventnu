/**
 * Decide whether to render a back control for the current view.
 *
 * In a standalone PWA on iOS there is no Safari toolbar and edge-swipe-back
 * is unreliable, so a visible back button is required to leave a detail page.
 *
 * We only show it when there is somewhere *in-app* to go back to:
 *  - `historyLength > 1` means the user navigated here from another page
 *    (a cold start / deep link has a fresh history of 1 and nothing to pop).
 *  - The home page is the root of the app — a back button there is noise.
 */
export function shouldShowBackButton({
  pathname,
  historyLength,
}: {
  pathname: string
  historyLength: number
}): boolean {
  if (pathname === '/') return false
  return historyLength > 1
}
