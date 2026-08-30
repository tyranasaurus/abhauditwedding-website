# Active Event Experience

## Goal

During configured wedding-event windows, the homepage should prioritize the
information a guest needs right now. The ordinary wedding website remains
available without competing with the live experience.

The experience is mobile-first, uses large labeled controls, and never relies
on hovering, swiping, or familiarity with map gestures. It should remain clear
to guests who are less comfortable with modern mobile interfaces.

## Core behavior

- An active-event view becomes the default during a configured event window.
- A lightweight, clearly labeled `Wedding info` pill opens the ordinary site.
- The ordinary site opens at the active event's schedule card rather than at
  the top of the homepage.
- While viewing the ordinary site, an event-aware return pill leads back to the
  active experience. Its message can change with the event, such as `Time for
  the Baraat!` or `Time to Naach!`.
- Switching views should preserve enough state to return the guest to what they
  were doing.
- The initial implementation has one active phase per event. Lead-in,
  progressive reveal, wind-down, and next-event phases are deliberate future
  extensions.

## Shared active-event shell

Every event uses the same three-part hierarchy:

1. A compact status header identifies the event and its time or live status.
2. A venue-level map highlights only the location, route, or destinations that
   matter for the active event.
3. Event-specific content follows the map in a consistent information panel.

Events may optionally provide a focused second-level map. On mobile, that map
replaces the venue map in the main map stage and provides an explicit `Back to
venue map` control. A small inset is not the primary interaction because it
would leave both maps too cramped to read or tap reliably.

The shell supports optional modules without changing its basic navigation:

| Event | Venue map | Focused map | Event module |
| --- | --- | --- | --- |
| Shaadi | Ceremony, dinner, and walking path | None | Current schedule |
| Baraat | Start, route, and finish | None expected | Procession guidance |
| Carnival | Carnival location | Carnival grounds | Activity passport |
| Reception | Hippodrome and exterior points | Hippodrome interior | Seating and points of interest |

## Proposed Naach the Night Away prototype

A first implementation could live at `/now` and have two manually selectable
test states. These would be prototype controls, not the eventual time-window
system.

### Before Event

- Highlight the Hippodrome on the venue map.
- Show the reception schedule.
- Show the reception wardrobe guidance.
- Provide directions to Carnation Farms.

### During Event

- Keep the same Hippodrome venue context.
- Replace the schedule and wardrobe module with the interactive seating-chart
  experience.
- Preserve the guest's seating selection using the seating chart's existing
  local storage behavior.

### Proposed test URLs

- `/now?phase=before`
- `/now?phase=during`

The prototype should keep production homepage behavior unchanged until real
event windows are configured.

### Implementation status (2026-08-29)

The active-event prototype is built at `/now`, for all three farm events
(Sunset Shaadi, From Carnegie to Carnation, Naach the Night Away; the watch
party is off-site and has no venue experience):

- `NowPage.tsx` renders the shared shell: status header, the venue aerial
  with only that event's locations highlighted, then the phase's module.
  Per-event config (highlights, intros, during-module) lives in
  `src/data/active-events.ts`.
- Which event and which phase are test states in `?event=` and `?phase=`,
  kept in sync via `replaceState`. They are switched by a floating
  admin-only Preview chip (dark, bottom-left, clearly a tool, not page
  content) — a temporary stand-in for the time-window system.
- Before Event hosts the event's ordinary `EventPanel` (schedule, wardrobe
  art, and note) plus a directions card to Carnation Farms.
- During Event swaps in the event's live module: the seating experience for
  the reception; the schedule again for the others until their own modules
  exist (procession guidance, the activity passport).
- During Event hosts `SeatingExperience`, the finder-and-floor-plan heart
  extracted from `SeatingChart.tsx`; the guest's stored pick carries over
  because both hosts share the same localStorage key.
- The Hippodrome is highlighted rather than pinned: a thin translucent box —
  white hairline stroke, milky fill — laid over the barn's painted footprint
  at the barn's own angle, the way a map highlights one building. The rest of
  the aerial stays at full color. No label — the header and intro already
  name it.
- The two-way handoff treats `/now` as the primary face during the event: a
  quiet `← Wedding info` button floats in its bottom-right corner and opens
  the ordinary site auto-scrolled to the reception's schedule card
  (`/#naach-the-night-away`), while the ordinary site carries an unmissable
  full-width `Time to Naach!` bar pinned to the bottom of the screen, leading
  to `/now`. The bar shows unconditionally for now; real time-window gating
  (and per-event messages) replaces that later.

## Future decisions

- Exact activation and handoff times for every event.
- Whether an open page changes events automatically or asks the guest to move
  to the newly active experience.
- Progressive reveal rules for the Carnival layout and activities.
- Focused-map assets, points of interest, and navigation for each event.
- Passport persistence and completion behavior.
- Reception exterior points of interest and seating lookup integration.
- Whether time-gated content is merely hidden in the interface or secured on
  the server.
