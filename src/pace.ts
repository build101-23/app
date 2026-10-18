// Shows streamed text at a steady pace. Network chunks land in uneven bursts, and printing each as it comes makes the
// bubble grow in jumps. Each animation frame reveals a share of what's waiting (an eighth, at least one character),
// so a burst spreads over a few frames and a slow trickle still moves.
export function paceText(show: (text: string) => void) {
  // Animation frames pause in a hidden tab, and reduced motion asks for no animation: show text as it arrives.
  const instant = () => document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches
  let target = ''
  let shown = 0
  let frame = 0
  let stopped = false
  let waiting: (() => void)[] = []

  const reveal = (to: number) => {
    // Never stop inside a surrogate pair: half an emoji draws as a broken character.
    const end = /[\ud800-\udbff]/.test(target[to - 1] ?? '') ? to + 1 : to
    shown = Math.min(end, target.length)
    show(target.slice(0, shown))
  }
  const finish = () => {
    if (stopped) return
    if (shown < target.length) reveal(target.length)
    waiting.forEach((resolve) => resolve())
    waiting = []
  }
  const tick = () => {
    frame = 0
    if (instant()) return finish()
    reveal(shown + Math.max(1, Math.ceil((target.length - shown) / 8)))
    if (shown < target.length) frame = requestAnimationFrame(tick)
    else finish()
  }

  return {
    push(text: string) {
      target += text
      if (instant()) finish()
      else if (!frame) frame = requestAnimationFrame(tick)
    },
    // Resolves once everything is shown, or after 2 s at most, so a paused tab can't keep the caller waiting.
    drained() {
      return new Promise<void>((resolve) => {
        if (shown >= target.length) return resolve()
        waiting.push(resolve)
        setTimeout(finish, 2000)
      })
    },
    // For a failed turn: its bubbles are being dropped, so nothing more may be shown.
    stop() {
      stopped = true
      cancelAnimationFrame(frame)
      waiting.forEach((resolve) => resolve())
      waiting = []
    },
  }
}
