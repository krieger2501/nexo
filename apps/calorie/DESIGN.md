# Nexo Calorie — Design Vision Handoff

A complete brief for implementing the calorie & macro tracker PWA, designed as part of the Nexo personal app suite (5–10 users, friends & family, single VPS). Anti-Yazio: calm, focused, no streak shaming, no upsells, no gamification of restriction.

---

## 1. Aesthetic Direction — "Clay Tablet"

Core concept: Burnt-sienna Ember on warm Bone. The app should feel like keeping a personal ledger — a quiet journal — not playing a video game. Sister apps in the Nexo suite use green (finance) and blue (admin); this one is warm/earthy.

**Typography:** Suite-default sans (Inter Variable) for body. Numerals get tabular-figure treatment universally — kcal counts and macro grams are first-class design citizens. Mono (JetBrains Mono Variable) for timestamps and small eyebrow labels.

**Tone:** Quiet, not cute. No emojis in the UI. Custom inline SVG icons everywhere. One-thumb reachable — primary actions in the bottom third or top-right corner. Honest progress: when over target, show it factually with a different hue, never a punishing red.

---

## 2. Design Tokens (app.css)

### Color tokens (OKLch)

```css
@theme {
	--color-ember: #b85a3a; /* primary accent */
	--color-ember-deep: oklch(48% 0.16 36);
	--color-ember-soft: oklch(70% 0.13 42);
	--color-ember-glow: oklch(82% 0.09 48);
	--color-ember-tint: oklch(95% 0.035 50);

	/* Macro hues — basic tier */
	--color-protein: oklch(58% 0.14 22); /* warm red-orange */
	--color-carbs: oklch(72% 0.14 78); /* amber */
	--color-fat: oklch(70% 0.1 92); /* yellow-olive */

	/* Macro hues — extended/full tier */
	--color-fiber: oklch(62% 0.11 148); /* sage */
	--color-sugar: oklch(72% 0.13 348); /* dusty rose */
	--color-satfat: oklch(50% 0.08 38); /* deep clay */
	--color-sodium: oklch(60% 0.06 232); /* slate */

	/* Status — distinct under vs over (NOT both red) */
	--color-undertarget: oklch(72% 0.1 88); /* honey amber */
	--color-ontarget: oklch(60% 0.12 148); /* sage */
	--color-overtarget: oklch(56% 0.14 24); /* terracotta */

	--color-accent: var(--color-ember); /* override suite default */
}
```

### Macro derivative variables (for soft backgrounds)

```css
--protein-soft: color-mix(in oklab, var(--color-protein) 12%, var(--color-bg-0));
--protein-line: color-mix(in oklab, var(--color-protein) 32%, var(--color-border-default));
/* repeat for carbs/fat */
--ember-soft-bg: color-mix(in oklab, var(--color-ember) 8%, var(--color-bg-0));
```

### Global CSS rule — kill native number spinners

```css
input[type='number'] {
	appearance: textfield;
	-moz-appearance: textfield;
}
input[type='number']::-webkit-inner-spin-button,
input[type='number']::-webkit-outer-spin-button {
	appearance: none;
	margin: 0;
}
```

This is mandatory — every numeric input in the app uses the custom Stepper/UnitStepper instead.

---

## 3. Type System (lib/types.ts)

Key additions beyond standard Profile / Targets / Entry / Food / WeightLog / DaySummary:

- `MacroTier = 'basic' | 'extended' | 'full'` — drives which macros appear in the UI
- `MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack'`
- `UnitId = 'g' | 'ml' | 'tsp' | 'tbsp' | 'cup' | 'piece' | 'shot'`
- `FoodUnit = { id: UnitId; gramsPerUnit: number; label?: string; default?: boolean }`
- `Food.units?: FoodUnit[]` — optional unit menu for richer logging
- `Entry.mealId?: string` — groups entries logged together as one meal
- `MealItem`, `Meal` — saved meal templates: `{ id, name?, mealSlot?, items: MealItem[], saved?: boolean }`
- `Moment = { id; kind: 'first_of_day' | 'welcome_back' | 'new_friend' | 'variety' | 'family_table'; headline; body?; at?: string }`

---

## 4. Core Components

### KcalRing.svelte — the hero

- SVG ring, default size **216px** (with bookend chips alongside) or **232px** (standalone)
- One background track (subtle, 0.28 opacity, hairline groove)
- Ember-gradient stroke for the filled arc, rounded linecaps, animated `stroke-dashoffset` (720ms, `cubic-bezier(0.32, 0.72, 0, 1)`)
- Soft blurred halo arc behind the fill (drop the rigid drop-shadow filter)
- Over-target renders as a thin (3px) terracotta arc **nested inside** the main arc — never overlaid on top
- Quarter beads outside the stroke at 0/25/50/75% — fill ember when reached, neutral otherwise
- Center: huge tabular numeral, `/ target` small below, then a single status line ("780 remaining" / "180 over target")
- **No tick marks slicing through the stroke. No inset shadow ring.** Those made it feel "border-y."

### MacroBar.svelte

- Slim 4px horizontal bar with hairline progress
- Label (eyebrow style) + tabular numerals "now / target g"
- Pass `--color-protein|carbs|fat|fiber|sugar` via `colorVar` prop
- Over-target: track recolors to `--color-overtarget` tint, fill stays in macro hue, plus a 3px cap dot at the right edge

### Stepper.svelte (base) and UnitStepper.svelte (preferred)

- iOS-feel: `−` round button | tap-editable tabular numeral | `+` round button on a soft tinted track
- Long-press support: hold for 360ms → repeats every 80ms
- Tap the number to swap to a transient input; blur/Enter commits, Escape cancels
- **UnitStepper** wraps the base with a tappable unit chip in the middle. Tap cycles units; internal grams stays canonical (kcal/macro math never changes), display reconverts and rounds appropriately:
  - Step sizes per unit: `g`/`ml`: 5, `tsp`/`tbsp`: 0.5, `cup`: 0.25, `piece`/`shot`: 1
  - Decimal precision: `g`/`ml`/`piece`/`shot`: 0, `tsp`/`tbsp`: 1, `cup`: 2
  - Plurals handled: 1 shot / 2 shots, 1 half / 2 halves
  - Unit chip is ember-tinted with a tiny up-down chevron when there are multiple units; transparent and inert when only `g`

### DateStrip.svelte

- Month nav header: ‹ chevrons + month/year label (tap label = jump to today, surfaces a tiny "Today" pill when not on the current month)
- Strip below shows the entire current month's days
- Future days dimmed and disabled
- Auto-scroll selected day to center on mount and on month switch (via `scrollIntoView`-style centering against strip's bbox)
- Next-month chevron disables when on current month
- Day chip: weekday letters mono-uppercase, large tabular day number, ember underline mark for today

### MealSlotChip.svelte

- Tiny lowercase chip with a dot and the slot label (Breakfast/Lunch/Dinner/Snack)
- Each slot gets a distinct hue tint:
  - breakfast: amber (oklch 72% 0.14 78)
  - lunch: ember
  - dinner: dusty blue (oklch 60% 0.12 268)
  - snack: sage (oklch 62% 0.11 148)

### TimelineRow.svelte

- Single entry: time mono on left, dot+rule, food name + grams + macro micro-tags + optional MealSlotChip, large tabular kcal on right
- Tap → opens EditEntrySheet

### MealGroup.svelte

- Multi-item entry sharing a `mealId`
- Same row geometry as TimelineRow — time + dot+rule on left, summary in middle, total kcal right, chevron rotates 180° on expand
- Inner items list (visible when expanded) — each item is a button that taps through to edit

### MealSection.svelte — per-slot band

- Numbered eyebrow (`01 — Breakfast`), serif slot name, item count + subtotal, small ember `+` button
- Thin progress bar showing kcal-vs-slot-target (default split: breakfast 30%, lunch 35%, dinner 30%, snack 5%)
- Empty state: dashed border tap target ("Nothing yet — tap to log")
- Renders MealGroup for grouped entries, TimelineRow for solo, Moment cards interleaved by `at` timestamp
- Accepts `onAdd(slot)` and `onEntryTap(entry)` callbacks

### Moment.svelte — gentle gamification card

- Standalone card style (don't mimic timeline row geometry — that was confusing)
- 3px ember left rail, 36×36 ember-tinted icon block, headline (display weight) + italic muted body + tiny mono time on the right
- Subtle radial ember bloom in the top-right corner of the card
- 380ms ease-up entrance animation
- Five kinds with distinct custom inline SVG icons:
  - `first_of_day` → sun cresting a baseline (sunrise)
  - `welcome_back` → circular return-arrow (food not seen 30+ days)
  - `new_friend` → five-pointed star (food never logged before)
  - `variety` → three overlapping dots in three opacity steps
  - `family_table` → two heads above a bowl curve
- **Critical filtering rule:** `first_of_day` should be hidden when entries already exist for the day — it's only meaningful when the day is genuinely empty

### MacroTierCard.svelte

- Numbered (`01 — Just the essentials`)
- Macro chips with their accent dot
- "Best for" line below
- Selected: ember left rail (3px), ember-tint background, ember check-disc

### ScannerReticle.svelte

- Full-screen camera mock (gradient + grain placeholder)
- Corner brackets only (28px L-shapes in `ember-glow`)
- Animated horizontal scan line that drifts up/down (1.6s, faster when searching)
- Top label adapts: idle / searching (with pulse dots) / not-found (with X icon)
- Glassy torch toggle top-right with `backdrop-filter` blur
- Bottom: dark scrim with manual barcode entry input + ember submit `↵`
- "Not found" state pivots to **Log manually** CTA

### CalendarHeatmap.svelte

- 7-row grid (Mon-start), columns are weeks
- Cell hue maps `kcal / target`:
  - <50% / 50–85%: `--color-undertarget` (honey) at low/high intensity
  - 85–105%: `--color-ontarget` (sage)
  - 105–120% / >120%: `--color-overtarget` (terracotta) at low/high intensity
- Today gets an ember outline
- Tap → opens that day's timeline in a BottomSheet
- Legend below

### WeightChart.svelte

- Custom SVG, no chart library
- Horizontal grid lines at 25/50/75
- 7-day rolling-avg as a smoothed `Q ... T` path in ember
- Daily dots: bone fill, ember-soft stroke
- Header: latest weight (large display), delta-since-oldest (down=sage, up=terracotta), "Log today" button → opens BottomSheet with a tap-to-edit hero numeral

---

## 5. Routes & Screens

### `/` — Today (the home)

Top-down composition:

1. **PageHeader** — Calorie title, subtitle, and two icon buttons in `actions`: ghost demo-toggle and primary ember `+` (opens AddEntrySheet with no preselected slot). **No floating FAB** — it hid content.
2. **DateStrip** with month nav
3. **Ring triptych section:**
   - 3-col grid `[bookend-left | KcalRing 216px | bookend-right]`
   - Bookends are tiny vertical stacks: large mono time + 18px rule + uppercase mono label. Left = first log time + "started"; right = "latest" + latest log time. Labels point inward like quotation marks.
   - Hidden (with `visibility:hidden` placeholders so the grid doesn't collapse) when there are no entries today
   - Soft elliptical ember bloom behind the whole triptych (`::before` pseudo, 7% ember opacity) — fills the empty space with intent, not with information
   - Bookends fade in 240ms after the ring lands
4. **Macro bars** — 2-col grid showing the macros for the user's tier (extended adds fiber + sugar)
5. **Section divider** — hairline + mono eyebrow `TODAY'S LOG`
6. **MealSection bands** — Breakfast / Lunch / Dinner / Snack stacked, each with their own `+` (preselects the slot when opening AddEntrySheet)

**Empty-day state** replaces ring/macros/sections with a centered illustration (dashed orbital + ember dot), serif title, body, and a single CTA.

### `/onboarding` — single-page wizard, flaschen-style

Single full-screen page with internal step state. Soft radial-gradient ember bg. Top: X skip button + progress pips (active pip widens). Bottom: back link + ember CTA pill.

Steps:

1. **Welcome** — Hero food-illustration SVG: a plate (radial-gradient fill) with three macro dots in their accent colors, an ember halo arc above (kcal-ring nod), minimalist fork + knife outlines flanking it, an animated steam wisp rising from the plate. Below: three feature cards with custom inline-SVG icons (cascade-fade entrance):
   - Plate-with-dots → "Log a meal in seconds"
   - Horizontal bars → "Track only what matters"
   - Calendar grid → "See patterns over time"
2. **Track what** — four MacroTierCards: Calories only / + Protein / + full Macros / Everything (with fiber/sugar/satfat/sodium)
3. **Method** — two icon cards: "Calculate from my stats" (Mifflin-St Jeor + activity, ember-tinted) vs "I'll enter my own numbers" (muted). If custom: skip step 4.
4. **Body** — sex segmented control + 3 stepper-rows (Age / Height / Weight using Stepper.svelte) + activity slider with serif current-value readout + goal pills (Lose / Maintain / Gain)
5. **Targets** — hero kcal numeral (tap-to-edit), macro grid showing only the macros for the chosen tier (kcal-only sees no grid), formula footnote at bottom: `Calculated from Mifflin-St Jeor · Maintain · Moderate`
6. **Done** — ember check-disc with dashed orbital ring, "Start logging" CTA → `/`

CTA on welcome reads `Get started`; subsequent steps read `Continue`.

### `/scan` — barcode scanner

Full-bleed dark page hosting ScannerReticle. Glassy back button top-left. Bottom-panel with a manual barcode entry field (mono, "8 to 14 digits"). On submit: cycle to `searching` → `not-found`, swap CTA stack to `Log manually` + `Try again`.

### `/history`

PageHeader, then:

- Card with WeightChart (140px tall) — tap "Log today" → BottomSheet with massive tap-to-edit kg numeral
- CalendarHeatmap — tap a cell → BottomSheet with that day's kcal-vs-target percentage and timeline preview

### `/settings` (or `/profile`)

PageHeader, ProfileHubCard from `@nexo/ui`, then:

- **Logline card** (gentle gamification) — see §6 below
- **Targets card** — kcal + P/C/F values, tap-to-edit
- **Macro tier switcher** (segmented control over the three tiers)
- **Body stats row** (age / height / weight)
- **Recipes coming-soon teaser card** — gradient ember background, sparkle icon, gentle promise copy

---

## 6. Gamification — "Stupid-simple, never restrictive"

**Hard rule:** never reward calorie restriction, never punish over-target, never run consumption streaks. Reward documentation, variety, and the act of remembering — never volume.

Two surfaces:

### Moments — inline timeline cards

Generated from data, surface in MealSection interleaved with entries by timestamp. Five kinds, all positive-framed:

- `first_of_day` — only when the day is empty; auto-suppressed once any entry exists
- `welcome_back` — fires when a food hasn't been logged in 30+ days. Headline includes the food: "Welcome back, banana" + body "It's been 9 days."
- `new_friend` — first time logging a food
- `variety` — 3+ different food colors logged in a day
- `family_table` — meal logged with someone (future-flagged for shared family logging)

### Logline — a generated playful title

Stored on the Settings page only (not on Today — keeps it personal, not branded). Generated from the user's most-frequently-logged food. Visible as a tinted gradient card with:

- Mono eyebrow: `Around here we call you`
- Display-italic title: e.g. "The Greek Yogurt Truther", "Espresso Scholar", "Friend of the Banana", "Sourdough Apologist", "Almond Enthusiast", "Spinach Pilgrim", "Chicken Breast Diplomat", "Brown Rice Loyalist", "Egg Apologist", "Avocado Apprentice", "Dark Chocolate Initiate"
- Small hint line: `Generated from what you've been logging. Refreshes as your patterns shift.`
- Soft radial ember bloom in top-right corner

Fallback when nothing logged: `Quiet ledger keeper`.

---

## 7. AddEntrySheet — meal-stacking BottomSheet

The flow:

- **Header:** title flips between `Log food` (single item in stack) and `Build a meal` (2+). Slot chip top-right (tap → expands a horizontal slot picker; preselects from caller via `initialSlot` prop)
- **Stack section** — only renders when ≥1 items: optional name input (only visible at 2+ items), compact list of stacked items (name + grams + kcal + remove), totals row (P/C/F mono + total kcal), save-as-template checkbox (only at 2+ items), `Add another item` hairline divider
- **Tabs** — Search / Scan / Recents / Favorites / Meals (saved templates). Scan tab navigates to `/scan` instead of switching tabs.
- **Search** with X-clear, results below
- **Inline-expand on tap** — tapping a result row inline-expands into a card with food name + brand, UnitStepper for amount, live kcal/P/C/F preview, and an `Add to meal` button. Other rows and the existing stack remain visible. Slide-down animation. Don't take over the whole sheet.
- **Sticky save bar** at the bottom (only when stack has items): label flips between `Log it` and `Save meal`, with a count badge and total kcal. Ember background, terracotta active state.

Each food has a `units` array — when expanded, the UnitStepper picks the food's default unit (espresso → ml, oil → ml, banana → piece, eggs → piece, sourdough → slice, avocado → half, chocolate → square; cooked grains → cup option; yogurt → tbsp/cup options).

### EditEntrySheet — for editing existing entries

Tap any TimelineRow or MealGroup inner item to open. BottomSheet with:

- Subtitle = food name
- Time + slot chip header
- UnitStepper for amount (preserves the entry's original unit menu)
- Live kcal/P/C/F preview card
- Slot pills row
- Two-button bottom: ghost terracotta `Delete` + ember `Save · 245 kcal`

**Decision: single tap to edit, not long-press.** Long-press is hidden affordance; tap is discoverable on a row that already has hover/active states.

---

## 8. Mock Data

Foods include (with smart units defaults):

| Food           | Default unit | Other units                 |
| -------------- | ------------ | --------------------------- |
| Espresso       | ml           | shot (30g)                  |
| Olive oil      | ml           | tsp (4.5g), tbsp (13.5g), g |
| Greek yogurt   | g            | tbsp (18g), cup (245g)      |
| Banana         | piece (118g) | g                           |
| Eggs           | piece (50g)  | g                           |
| Sourdough      | g            | slice (35g)                 |
| Avocado        | g            | half (170g)                 |
| Brown rice     | g            | cup (195g)                  |
| Almonds        | g            | tbsp (9g), cup (143g)       |
| Spinach        | g            | cup (30g)                   |
| Dark chocolate | g            | square (10g)                |
| Chicken breast | g            | (none)                      |

Today's mock entries should include at least one grouped meal (e.g., chicken + rice + avocado + olive oil sharing `mealId: 'm-lunch-1'`) and 2–3 solo entries (espresso, snack), so the timeline shows both flat rows and MealGroup collapsibles.

Three saved meal templates (`savedMeals`): "Typical lunch" / "Morning protein bowl" / "Eggs & sourdough".

Three sample moments for today: `first_of_day` at 7:11 (will get filtered when entries exist), `welcome_back` for banana at 8:07, `variety` at 13:35.

90 days of weight logs with gentle downtrend + noise; 90 days of dailyKcal for the heatmap with weekday/weekend variance and occasional missed days.

---

## 9. i18n

All strings keyed in `messages/en.json` + `messages/de.json`. Use the suite-standard `m.key_name()` pattern (Paraglide). Key namespaces to add:

- `track_*` — tier names, taglines, "best for" lines
- `onb_*` — wizard step titles, descriptions, feature card titles/bodies
- `meal_*` — builder heading, name placeholder, total, save-template label/hint, save buttons (one vs many), add-more divider
- `edit_entry_heading`
- `profile_logline_eyebrow`, `profile_logline_hint`
- `daystrip_today`, `daystrip_yesterday`
- `action_*` — `log_food`, `save`, `cancel`, `continue`, `get_started`, `back`, `done`, `edit`, `delete`, `log_manually`, `torch`, `skip`
- Macro labels (`protein`, `carbs`, `fat`, `fiber`, `sugar`, `satfat`, `sodium`)
- Meal slot labels
- Scan flow strings
- History headings + heatmap legend (under / on / over)

DE uses German plural-correct forms and avoids any "streak" / "score" framing.

---

## 10. Implementation Notes

- **Form actions:** every mutating UI (onboarding submit, AddEntrySheet save, EditEntrySheet save/delete, weight logging) routes through SvelteKit form actions with `use:enhance`, per Nexo conventions. Server actions persist; UI flips `open = false` in the `update()` callback.
- **CSP:** inherit suite defaults, no inline scripts. SVG inline is fine (it's authored in components).
- **PWA:** `@vite-pwa/sveltekit` with `registerType: 'autoUpdate'`, `navigateFallback` to `/offline`, theme color `#b85a3a`, manifest icons in `static/icons/`.
- **Accessibility:** stepper buttons have `aria-label`s, the moment cards use `role="note"`, the heatmap cells expose `aria-label="{date}: {kcal} kcal"`, the BottomSheet handles Escape and pointer-drag dismissal.
- **Performance:** no chart library — WeightChart and KcalRing are hand-written SVG. Animations are CSS-only (one well-orchestrated entrance per screen), respect `prefers-reduced-motion`.
- **Dark mode:** tokens already shift via `prefers-color-scheme: dark` + manual `[data-theme='dark']`. Bone surfaces become deep warm-grey, ember brightens slightly. The radial bglow + the moment-card ember tint both auto-adapt via `color-mix`.
- **Suite reuse:** import `BottomSheet`, `BottomNav`, `PageHeader`, `PageShell`, `ProfileHubCard`, `SectionLabel`, `SettingsCard`, `AboutDiagnostics`, `Toast`, `KonamiCode`, `UpdatePrompt` from `@nexo/ui`. Do not reimplement.

---

## 11. The One Thing

If only one design choice survives translation: **the kcal numerals.** Tabular figures, generous letter-spacing-negative, room around them. Numbers are the content; treat them like the content.
