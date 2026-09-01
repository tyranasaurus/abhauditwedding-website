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
- Carnegie to Carnation is one view with two faces, matching the day
  itself. Before Event is the Baraat: the venue aerial with the procession
  drawn on it — a dashed carnival-pink route over a milky casing, hand
  traced along the painted farm roads, with dots and labeled plates at both
  ends (`Baraat starts here`, `…into the Carnival!`) and the big field
  highlighted where the route pours in. During Event swaps in the carnival
  map and activity passport, while the aerial stays on above them as a mini
  map (`.now-map.is-mini`) — the procession is over by then, so the mini map
  drops the route for a small `The Carnival` plate over the field, and two
  measured callout lines fan from the field highlight down to the lawn
  map's top corners so the big map reads as the zoomed-in field
  (`.now-zoom-stack`). Route data lives in `active-events.ts`
  as `MapRoute`; the dash march is disabled under reduced motion. The real
  baraat→carnival swap at carnival start is the time-window system's job —
  the Before/During toggle stands in for it.
- Temporary trace tooling: the admin chip's `Trace aerial` (`?trace=1`)
  swaps any event's map for `NowMapEditor.tsx` — drag the highlight boxes
  (corner dot resizes, knob rotates), drag route waypoints, click the line
  to add one, double-click to remove, drag the label plates, then `Copy
  data` for paste-ready `highlights:`/`route:` fields. Drafts persist per
  event in localStorage until Reset. Rip it out with the carnival sticker
  editor (`Edit stickers`, `?edit=1`) once tracing is final.
- Which event and which phase are test states in `?event=` and `?phase=`,
  kept in sync via `replaceState`. They are switched by a floating
  admin-only Preview chip (dark, bottom-left, clearly a tool, not page
  content) — a temporary stand-in for the time-window system.
- Before Event hosts the event's ordinary `EventPanel` (schedule, wardrobe
  art, and note) plus a directions card to Carnation Farms.
- During Event swaps in the event's live module: the seating experience for
  the reception, and the activity passport for the carnival — a stampable
  checklist of the lawn's activities wearing the map's own art, with stamps
  kept in localStorage (`CarnivalPassport.tsx`; it also shows before the
  event as the menu of what's coming). The shaadi keeps the schedule until
  procession guidance exists. Passport progressive reveal and cross-device
  persistence remain future decisions.
- During Event hosts `SeatingExperience`, the finder-and-floor-plan heart
  extracted from `SeatingChart.tsx`; the guest's stored pick carries over
  because both hosts share the same localStorage key.
- The Hippodrome is highlighted rather than pinned: a thin translucent box —
  white hairline stroke, milky fill — laid over the barn's painted footprint
  at the barn's own angle, the way a map highlights one building. The rest of
  the aerial stays at full color. No label — the header and intro already
  name it.
- The static site is the live site (decided 2026-08-31, superseding the
  `/now`-as-primary-face handoff): during each phase window the homepage
  itself goes live. `src/data/live-phases.ts` is the schedule of record —
  five windows on the venue's clock (shaadi all Saturday; pre-baraat until
  11; during-carnival 11–2:30; pre-reception 2:30–4:45; during-reception
  4:45–11) — and while one is open: (1) the page auto-scrolls to that
  event's schedule card on arrival (piggybacking the hash-hold logic, never
  overriding an explicit hash, once per visit); (2) phases with an
  interactive page get a floating bottom pill in the event's colors —
  `Open your Carnival Passport` → `/passport`, `See the Seating Chart` →
  `/seating-chart`. The static site carries no map (also decided
  2026-08-31, reversing the brief `Where to go` card-map experiment);
  wayfinding belongs to the interactive pages. Outside every window the
  homepage is just the homepage: no pill (the old unconditional
  `Time to Naach!` bar is gone). `?live=<phase-id>` (or `off`) overrides the
  clock and shows the dev navigator — the floating phase chip, which now
  sits top-center under the site header so it never covers the pills and
  corner buttons along the bottom.
- `/passport` is the carnival's interactive page: the lawn map and the
  stampable passport (stamps shared via localStorage with everywhere else
  they appear), in the carnival's own colors. The seating chart page was
  already dressed in the reception's forest and copper. There is no shaadi
  live page yet; its phase has a map only.
- `/now` remains as an admin prototype (and hosts the aerial trace editor);
  it is no longer linked from the site.

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
