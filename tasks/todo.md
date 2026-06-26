# Task: Prev/Next navigation on the sloka detail screen

Add prev/next navigation to `app/sloka/[id].tsx` that walks the list context the
user came from (My Slokas, the chapter/source browse view, or search results),
falling back to the global 180 order (source → chapter_verse). Stay within the 180-set.

## Approach
Pass the ordered list of ids the user is browsing as a `list` route param
(comma-joined). The detail screen reads it, finds the current index, and walks
prev/next within it. No `list` param → fall back to the global
`groupBySourceAndChapter(slokas)` order.

## Todo
- [ ] Branch `feature/sloka-prev-next` (done)
- [ ] `SlokaCard`: add optional `listIds?: string[]` prop; both card variants pass
      `list` param on navigate.
- [ ] `slokas.tsx`: compute the displayed (filtered+grouped) ordered ids, pass to cards.
- [ ] `my-slokas.tsx`: pass the saved ordered ids to cards.
- [ ] `[id].tsx`: read `list` param → ordered ids (fallback to global order);
      compute prev/next; add slim bottom "‹ Prev / Next ›" bar; add horizontal
      swipe (PanResponder); navigate with `router.replace` carrying `list` forward.
- [ ] Typecheck.
- [ ] Show diff (do NOT deploy).

## Review

Implemented on branch `feature/sloka-prev-next`. Typecheck passes.

Changes (4 files, +149/-15):
- **SlokaCard.tsx** — optional `listIds?: string[]` prop; new `slokaHref()` helper
  appends the ordered ids as a `list` route param when present.
- **slokas.tsx** — `orderedIds` = flattened (search + source-filtered, grouped)
  display order, passed to every card → prev/next walks search/chapter results.
- **my-slokas.tsx** — passes the saved set's order to every card.
- **[id].tsx** — reads `list` param → ordered ids (each validated against the
  180-set), falls back to the module-level global order
  (`groupBySourceAndChapter(slokas)`); computes prev/next; adds a slim bottom
  "‹ Prev  ·  N / total  ·  Next ›" bar (ends dim+disabled) and horizontal swipe
  via `PanResponder` (left→next, right→prev; only claims horizontal-dominant
  gestures so vertical scroll still works). Navigation uses `router.replace`
  carrying `list` forward, so Back still returns to the list.

Notes / minor trade-offs:
- Stays within the 180-set: ids from `list` are filtered through the global set,
  and prev/next are bounded by array edges.
- `router.replace` keeps the same component mounted, so the Purport expand/collapse
  state carries across prev/next. Harmless; left as-is for simplicity.
- Not deployed — awaiting diff review.
</content>
</invoke>
