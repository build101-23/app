# Smoother streamed text

## Context
The reply's text appears in jumps. Three causes, all in the browser (`src/Chat.tsx`):
- **Bursts.** The text is printed as each network chunk lands, and chunks arrive in uneven bursts (a few characters, then forty, then a pause), so the bubble grows in steps and, early on, jumps in width.
- **Scrolling.** `scrollIntoView` runs after every update, in an effect that runs after paint, so the list jumps to the end a frame late each time. It also pulls you back down when you've scrolled up to read.
- **The status line.** It's empty most of the time and takes a line when a reply starts and gives it back when it ends, shifting the content under the scroll position.

## Approach
1. **Pace the text** (`src/pace.ts`, used by `submit`). Chunks go into a buffer; each animation frame reveals a share of the backlog (an eighth of it, and at least one character), so a burst spreads over a few frames and a trickle still moves. The stream's end waits for the buffer to drain before the stored turn is reloaded, so the reload doesn't cut the reveal short.
   - It shows everything at once when the tab is hidden (animation frames pause there, and the lock would otherwise outlast the reply) and when the user prefers reduced motion. `drained()` gives up after 2 s.
2. **Scroll in a layout effect, only while you're at the end.** `useLayoutEffect` runs before paint, so the bubble and the scroll move in the same frame. A `scroll` listener keeps a "pinned" flag (within 80 px of the end); sending a message pins it, and scrolling up to read unpins it, so new text never pulls you back.
3. **Reserve the status line's height** (`min-height: 1.5em`), so it appearing and going doesn't move anything.
4. **Fixture:** a `reply=burst` scenario with uneven chunks (5 to 80 characters, 80 to 350 ms apart), like a real stream, documented in `development.md`.

Not done: markdown or any restyling of the bubble; the server stays as is ([ADR 0029](../adr/0029-chat-streams-its-steps.md)).

## Check
`npm run dev:fixture`, `?reply=burst`, a long chat: send a message and sample every frame the characters added to the last bubble and the list's scroll jumps, before and after. Scroll up mid-reply and see that nothing pulls you down. `npm run lint` and `npm run build`.

## Docs
`docs/development.md` (the `burst` scenario), `docs/design.md` (Chat: the status line's reserved line, the paced text).

## Results
- Measured in `npm run dev:fixture` with `?reply=burst`, sampling every animation frame while a reply streamed (284 characters, six uneven chunks):

  | | Before | After |
  | --- | --- | --- |
  | Frames in which the text grew | 6 | 80 |
  | Characters added per frame, average / most | 47.3 / 77 | 3.5 / 10 |

- The list's scroll moves only when a line wraps, 23 px at a time and by the same amount the content grew, in the same frame. Before, every chunk caused its own jump.
- Scrolling up mid-reply held: `scrollTop` stayed at 0 until the end. The list ended pinned at the bottom otherwise.
- `npx tsc -b`, `npm run lint` and `npm run build` pass.
- Not verified: the real stream (the fixture's bursts only imitate it), a hidden tab (the code path is `document.hidden`, not exercised), reduced motion, and a phone. The reveal adds up to about 0.5 s after the last chunk while the buffer drains.
