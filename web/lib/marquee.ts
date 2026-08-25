/**
 * Whether the FeaturedMarquee auto-scroll loop should advance this frame.
 *
 * The rAF loop stays scheduled regardless (so it can cheaply resume), but it
 * skips the per-frame translate work when the strip cannot be seen:
 *  - `inView`      — the strip has scrolled out of the viewport. Continuous
 *    transform work for an off-screen element wastes CPU/GPU on iOS.
 *  - `tabVisible`  — the tab is backgrounded or the screen is off; browsers
 *    throttle rAF anyway, but this makes the intent explicit.
 *  - `hovered`     — a real pointer is over the strip (desktop): the user is
 *    reading or manually scrolling, so auto-scroll must not fight them.
 *
 * Kept pure so the pause/resume contract is unit-testable in isolation.
 */
export function shouldAnimateMarquee({
  inView,
  tabVisible,
  hovered,
}: {
  inView: boolean
  tabVisible: boolean
  hovered: boolean
}): boolean {
  if (!inView) return false
  if (!tabVisible) return false
  if (hovered) return false
  return true
}
