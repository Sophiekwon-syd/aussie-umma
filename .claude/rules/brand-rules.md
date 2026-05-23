# Brand Rules

These rules apply to every agent in the pipeline. No exceptions.

## Content rules

- **No emojis** — not in headings, body text, CTAs, labels, or anywhere else
- **No placeholder text** — every field in the output must contain real, audience-appropriate copy
- **No product or brand names** — refer to categories, not specific products
- **No absolute claims without sources** — if using a statistic, cite it
- **Topics to avoid** — always read `config.json` → `content.topics_to_avoid` before generating topics

## Language rules

- Write in the language of `content.target_audience` in `config.json`
- Do not mix languages within a card (English labels like "Do / Don't" are design elements, not copy)
- The CTA text must match `content.cta_text` from `config.json` exactly

## Structure rules

- Exactly `pipeline.cards_per_carousel` cards per HTML file — no more, no fewer
- Every card: 1080px × 1350px
- Every card has a footer with brand name left, page number right
- The active dot in the progress indicator must match the card's position

## Tone rules

- Read `tone-guide.md` before writing any copy
- Empathy → insight → confidence arc across the 10 cards
- Never drive action through fear or urgency
- Short sentences. One idea per card. Conclusion first.

## File rules

- One commit per file
- No Co-Authored-By trailers
- Do not commit `node_modules/` or `.cache/`
- `outputs/`, `config.json`, `tone-guide.md`, and `topic-memory.json` ARE tracked in this personal repo (required by the Post to Instagram workflow, which fetches PNGs via raw.githubusercontent.com)
