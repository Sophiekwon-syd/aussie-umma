# Brand Rules

These rules apply to every agent in the pipeline. No exceptions.

## Content rules

- **No emojis** — not in headings, body text, CTAs, labels, or anywhere else
- **No placeholder text** — every field in the output must contain real, audience-appropriate copy
- **No product or brand names** — refer to categories, not specific products
- **No absolute claims without sources** — if using a statistic, cite it
- **Topics to avoid** — always read `brands/<BRAND>/config.json` → `content.topics_to_avoid` before generating topics

## Language rules

- Write in the language of `content.target_audience` in `brands/<BRAND>/config.json`
- Follow the brand's `card` language config in `brands/<BRAND>/config.json`. When `card.bilingual`
  is true, render `card.primary` large and `card.subtitle` small and muted directly
  beneath it (English headline + Korean subtitle). When false, render the primary
  language only.
- The CTA text must match `content.cta_text` from `brands/<BRAND>/config.json` exactly

## Structure rules

- Card count within `pipeline.card_count_range` — fit the format to the topic, never pad
- Required spine in order: cover → hook → … → sheet (save-bait) → cta
- No more than two consecutive cards of the same type; include at least one `statement` (dark) rhythm card
- Every card: 1080px × 1350px
- The brand handle (`.handle`) sits at top-right of every card; there is no footer
- No in-card carousel-position dots or page-number watermark — Instagram renders its own carousel UI beneath the post

## Tone rules

- Read `brands/<BRAND>/tone-guide.md` before writing any copy
- Empathy → insight → confidence arc: cover + hook → middle → sheet + cta (7–11 cards per topic)
- Never drive action through fear or urgency
- Short sentences. One idea per card. Conclusion first.

## File rules

- One commit per file
- No Co-Authored-By trailers
- Do not commit `node_modules/` or `.cache/`
- `outputs/`, `brands/*/config.json`, `brands/*/tone-guide.md`, and `brands/*/topic-memory.json` ARE tracked in this personal repo (required by the Post to Instagram workflow, which fetches PNGs via raw.githubusercontent.com)
