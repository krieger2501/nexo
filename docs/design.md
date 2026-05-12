# Design System

Nexo's visual language. Light surfaces, per-app accent colors, quiet confidence.
Follow this when building new pages or apps — it's what keeps them feeling like
one suite rather than six separate projects.

> **TL;DR** — Five surface layers, three border weights, four text weights, one
> accent per app. Spacing is 4px-base. Radius is generous (cards: 20px). Motion
> is fast and _un_-bouncy.

---

## 1. Color

Tokens live in `src/app.css` inside `@theme {}` and are emitted by Tailwind v4
as utilities (`bg-bg-0`, `text-text-muted`, `border-border-default`, etc.).
**Light theme only** — no dark mode toggle.

### Surfaces — five layers, light-on-light

| Token               | Hex       | When to use                                       |
| ------------------- | --------- | ------------------------------------------------- |
| `--color-bg-0`      | `#fafaf9` | Page background. The default canvas.              |
| `--color-bg-1`      | `#f4f4f2` | Inset wells, code blocks, subtle backdrops.       |
| `--color-bg-2`      | `#ececea` | Status pills, kbd-tags, low-contrast chips.       |
| `--color-surface-1` | `#ffffff` | **Cards.** Pure white — the default card surface. |
| `--color-surface-2` | `#fbfbfa` | Card hover state. Modal background.               |

Cards lift on hover (`translateY -3px`) — never darken on hover.

### Borders — three weights

- `--color-border-subtle` (rgba 6%) — silent dividers, section breaks.
- `--color-border-default` (rgba 10%) — **the default card border.**
- `--color-border-strong` (rgba 18%) — secondary buttons, key dividers.

### Text — four weights

- `--color-text-primary` `#18181b` — headings, key copy.
- `--color-text-muted` `#52525b` — body copy, descriptions.
- `--color-text-subtle` `#71717a` — labels, secondary nav, footers.
- `--color-text-faint` `#a1a1aa` — meta, timestamps, locked states.

### Accents — one per app

Accent is **never** a global brand color — it belongs to the app the user is in.
The landing page uses Finance green by default; each app route sets
`data-app="<id>"` on its layout wrapper, which rewires `--color-accent` for
everything inside.

| App          | Accent    | Mood                                  |
| ------------ | --------- | ------------------------------------- |
| Finance      | `#16a34a` | Calm green. Money is a stable signal. |
| Gym          | `#f97316` | Warm orange. Effort.                  |
| Time Tracker | `#3b82f6` | Cool blue. Receipts.                  |
| Pomodoro     | `#ef4444` | Red. Urgency, but readable.           |

**Color-usage rules:**

1. On light surfaces, raw accent reads "loud." For text on white, use
   `color-mix(in oklab, var(--color-accent) 80%, #000)` — this is what the
   icon tile glyph, status-pill text, and link arrow use.
2. Accent **fills** are reserved for primary buttons (white text on accent),
   the brand mark, and the home-screen icon mock.
3. Use `color-mix(in oklab, var(--color-accent) X%, ...)` for soft accent
   washes — never raw alpha hex.
4. Don't use accent for body copy. Accent is a signal; body is content.

---

## 2. Typography

Two faces. **Inter Variable** for everything chrome and copy; **JetBrains Mono**
for labels, metadata, code, version tags.

### Scale

| Token          | Size                    | Line | Tracking | Weight | Use                           |
| -------------- | ----------------------- | ---- | -------- | ------ | ----------------------------- |
| `--text-hero`  | `clamp(56px,8vw,104px)` | 0.96 | -0.04em  | 600    | One per page. The page name.  |
| `--text-h1`    | `clamp(36px,4vw,52px)`  | 1.05 | -0.025em | 600    | Section titles.               |
| `--text-h2`    | 28px                    | 1.2  | -0.015em | 600    | Card titles, sub-sections.    |
| `--text-body`  | 16px                    | 1.55 | 0        | 400    | Copy.                         |
| `--text-small` | 14px                    | 1.5  | 0        | 400    | Secondary copy, step bodies.  |
| `--text-label` | 11px (mono)             | 1    | 0.12em   | 500    | UPPERCASE chips, "01 — Apps". |

**Rules:**

- Hero gets a subtle gradient fade from `#18181b` (primary) to
  `color-mix(primary 65%, bg-0)` — gentle weight loss as the eye drops.
  Nothing else gets gradient text.
- Numbered section labels (`01 — Apps`, `02 — Install`) use the mono label
  style; never sans.
- Don't use `font-weight: 700` — the design tops out at 600.
- `text-wrap: pretty` on body paragraphs.

---

## 3. Spacing

A 4px base. Tailwind v4 derives `p-4` = `16px` etc. from `--spacing: 4px`.

Common multiples to reach for:

- `4 / 8 / 12` — inside chips and pills
- `16 / 24` — card internals
- `32` — card padding
- `48 / 64` — section padding (top/bottom)
- `96 / 128` — hero verticals

Don't hand-pick odd values. If you need a new spacing token, add it to `@theme`
and let Tailwind generate the utility.

---

## 4. Radius

| Token          | Px  | Use                              |
| -------------- | --- | -------------------------------- |
| `--radius-xs`  | 4   | Inline tags, kbd.                |
| `--radius-sm`  | 6   | Brand mark, tiny chips.          |
| `--radius-md`  | 10  | Buttons, icon tiles, share rows. |
| `--radius-lg`  | 14  | Phone screen, modal panels.      |
| `--radius-xl`  | 20  | **Default card radius.**         |
| `--radius-2xl` | 28  | Hero panels, large cards.        |
| `999px`        |     | Status pills, dots, eyebrows.    |

The brand mark is intentionally `sm` (sharp, technical) against the soft cards (`xl`).

---

## 5. Card anatomy

The atomic unit. Lives on the landing grid and inside individual apps (account
cards in Finance, etc.).

```
┌─────────────────────────────────────────┐
│  [icon-tile]              [status-pill] │  ← head row
│                                         │
│  H2 App name                            │  ← --text-h2, primary
│  Body description, --text-muted.        │  ← flex: 1
│                                         │
│  [meta · mono · faint]      [card-link] │  ← foot row
└─────────────────────────────────────────┘
   surface-1 (white)  +  border-default
   --radius-xl  +  padding 32  +  min-height 280
```

**Hover behavior:**

1. `translateY(-3px)` — gentle lift.
2. Border tints toward accent: `color-mix(accent 40%, default)`.
3. Background lifts to `surface-2` (the warm off-white).
4. Radial accent wash follows the cursor (`--mx`, `--my` set on mousemove).
5. The card-link arrow widens its gap from 6px to 10px.
6. All transitions: `--duration-base` (240ms), `--ease-out`.

**Locked state** (future apps): `opacity: 0.6`, no hover lift, icon tile uses
`bg-2 / text-faint`. Status pill says "Coming soon" or "Planned".

---

## 6. Buttons

Three flavors. One height (40px including border).

| Variant   | Background       | Border                  | Text                                    | Use                               |
| --------- | ---------------- | ----------------------- | --------------------------------------- | --------------------------------- |
| Primary   | `--color-accent` | none                    | `#ffffff` 600wt                         | The call to action. One per view. |
| Secondary | transparent      | `--color-border-strong` | `--color-text-primary`                  | Alternative actions.              |
| Ghost     | transparent      | none                    | `--color-text-muted` → primary on hover | Cancel, dismiss.                  |

Primary text is **white on accent** — all four app accents pass 4.5:1 against
white (WCAG AA).

**Hover:**

- Primary → `color-mix(accent 88%, black)` — slight darken for confirmation.
- Secondary → `bg-bg-1` + `border-text-subtle`.
- Ghost → `text-primary`.

**Active:** `transform: translateY(1px)` for primary only.

---

## 7. Motion

Three durations, two eases. **Subtle, not bouncy.**

| Token             | Duration | Ease            | Use                           |
| ----------------- | -------- | --------------- | ----------------------------- |
| `--duration-fast` | 150ms    | `--ease-out`    | Hover color, link gap.        |
| `--duration-base` | 240ms    | `--ease-out`    | Card lift, panel transitions. |
| `--duration-slow` | 480ms    | `--ease-in-out` | Scene transitions, big fades. |

**Eases:**

- `--ease-out` = `cubic-bezier(0.2, 0.7, 0.2, 1)` — fast start, soft land.
- `--ease-in-out` = `cubic-bezier(0.65, 0, 0.35, 1)` — symmetric, for crossfades.

**No overshoot. No bounce.** Confident, not goofy.

### Canonical patterns

1. **Card hover lift** — see § 5.
2. **Reveal on scroll** — sections start at `opacity: 0; translateY(14px)` and
   animate to `opacity: 1; translateY(0)` over 600ms with `--ease-out` when
   ≥12% of the element enters the viewport. Triggered once. Use
   `IntersectionObserver`.
3. **Live dot pulse** — accent dots inside eyebrows / "Live" pills pulse
   `opacity 1 → 0.5` and `scale 1 → 0.85` on a 2.4s cycle, `--ease-in-out`.
4. **Link arrow lean-in** — `card-link` gap goes 6 → 10px on card hover.

Avoid: parallax on scroll, anything moving more than 16px in response to hover,
anything that animates color via stops (use `color-mix` directly).

---

## 8. Backgrounds

Three hero treatments, all driven by `--color-accent`:

- **`grid`** (default) — 64px line grid (rgba 5%) with a soft accent glow at
  50% top, radial mask fading to transparent at the edges. Quiet, technical.
- **`mesh`** — three soft radial blobs (accent + indigo + accent) with a
  22-second drift animation. Premium, ambient.
- **`dots`** — 28px dot grid (rgba 10%) + accent glow.

All backgrounds are dimmed with `mask-image: radial-gradient(...)` so they fade
to pure `--color-bg-0` at the edges — the page never looks "patterned to the
corners".

Body sections use plain `--color-bg-0` — patterns belong to the hero.

---

## 9. Iconography

- **App marks** are **monograms** in JetBrains Mono 22px / 500wt, rendered
  inside the icon tile (44–48px rounded square) with the accent fill at 12%
  (mixed into white) and a 30% accent border. Cheap to add a new app, impossible
  to look inconsistent.
- **UI icons** (arrows, share, etc.) are 1.5px line weight, `currentColor`,
  `stroke-linecap: round`, `stroke-linejoin: round`. Inline SVG only — no icon
  font.
- Avoid drawing illustrative SVGs. Use real screenshots and content placeholders
  for marketing imagery.

---

## 10. The phone mockup

The PWA install walkthrough uses a dark-screen iPhone on the light page. This is
intentional — most iOS users keep dark mode on, and it gives the mockup contrast
against the light surrounding. The phone bezel uses `#18181b → #0e0e10`; the
screen is `#0a0a0a` with light text. App content shown in the mock should always
render in the app's natural mode.

---

## 11. Adding a new app

1. Pick an accent. Run it past these checks:
   - Distinct from existing accents in hue.
   - Passes 4.5:1 contrast against white (for primary buttons).
   - The 80%-mixed-with-black version reads cleanly on white surfaces.
2. Add to `@theme`: `--color-accent-<id>: #...;`
3. Add the `[data-app="<id>"]` selector to `apps/landing/src/app.css`.
4. Add an entry to the `apps` array in `apps/landing/src/routes/+page.svelte`
   with monogram, status, meta, and href.
5. Inside the app's root layout, wrap in `<div data-app="<id>">` so all tokens
   cascade.

That's it. No bespoke styles per app — the only thing that changes is the accent
variable.

---

_Last updated: 2026-05-12 · Nexo v0.8.2_
