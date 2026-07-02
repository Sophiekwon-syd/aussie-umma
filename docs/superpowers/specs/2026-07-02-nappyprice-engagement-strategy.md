# NAPPYPRICE Carousel Strategy — Read-to-End & Save-Worthy

**Date:** 2026-07-02
**Goal:** Make nappyprice carousels stop the scroll, hold attention to card 10, and earn the save. Give the pipeline the flexibility to fit the format to the topic instead of forcing every topic into the same 10 identical cards.

---

## 1. Diagnosis — why the current output feels flat

Grounded in the 2026-06-30 "Unit Pricing Mastery" carousel (the most recent build):

1. **Ten cards, one shape.** Cover, data, checklist — all `label → headline → body`, centered, same weight. No visual rhythm, so the eye has no reason to stop or continue.
2. **The numbers aren't the hero.** The brand *is* numbers, yet card 4 ("The Data") renders a 3.3× cost gap ($0.15 vs $0.50 → $1,200/yr) as four grey text pills. The most save-worthy fact on the account is the most under-designed element.
3. **Dead space.** Top third and bottom quarter of cards are empty. Content floats mid-card looking unfinished, not confident.
4. **No screenshot artifact.** Nothing is built to be *the one card* someone saves and re-opens in the aisle — no cheat-sheet, formula, or rule-of-thumb card.
5. **The template fights the topic.** Fixed 10 cards and a fixed card order regardless of whether the topic wants a punchy 7 or a 6-row comparison table.
6. **Underused power tools.** `tokens.css` already ships `.stat-val` (260px hero number), `.cmp-row` (side-by-side), `.quote`, `.takeaway`, `.si` steps. The planner/copywriter rarely reach for them and default to the safe body card. Half the fix is *usage discipline*, not new CSS.

---

## 2. Strategic principles

Five principles govern every carousel. They map directly to the two goals: **finish rate** (read to the end) and **save rate**.

### P1 — Earn the swipe on every card (finish rate)
Each card must create a reason to see the next one. Techniques:
- **Open a loop** on the cover and the hook: promise a specific, quantified payoff ("the $1,200 mistake", "the number on the shelf tag everyone ignores"). Don't resolve it until mid-carousel.
- **One idea per card, delivered fast.** Conclusion first, then the reason. Never make the reader work to find the point.
- **Escalate.** Cards should build — problem → the number → the method → the payoff — so momentum increases toward the end rather than trailing off.

### P2 — Make the number the hero (both goals)
This is a numbers account. On any card where a figure carries the insight, the figure is the largest thing on the card. Big number, then the label, then one line of context. A price gap gets a **visual contrast** (bar, split, ratio), never a text pill.

### P3 — Design one save-bait card per carousel (save rate)
Every carousel contains at least one card engineered to be screenshotted and reused:
- a **cheat-sheet** (the 4-check shopping list, formatted as a clean scannable card),
- a **formula/rule** ("box price ÷ count = what actually matters"),
- a **comparison table** (sizes vs unit price), or
- a **benchmark** ("under $0.20/change = good; over $0.35 = check twice").

The save-bait card is the reason the whole post gets saved. It must look like a reference, not a paragraph.

### P4 — Vary the visual weight (finish rate)
Alternate card "temperatures" so the carousel has rhythm: light content cards, then a bold **statement card** (dark or full-accent background, one big number or line), then back to light. A reader scrolling a monotone deck stops; contrast pulls them through.

### P5 — Fit the format to the topic (both goals)
Card count and card order are chosen per topic, within a range — not fixed at 10. A tight tip needs 7 strong cards; a full comparison guide might use 11. Better to ship 7 cards that all earn their place than 10 where 3 are filler.

---

## 3. Visual system upgrades

Keep the current light aesthetic and the coral/teal palette. Add weight. All of these are additive to `tokens.css` / the card templates.

### 3a. Kill the dead space
- Give content cards a real top-anchored structure instead of pure vertical centering: section label near the top, headline, then body filling the middle third. The current `.center-block` floats everything into a narrow band. Tighten the used area to roughly the top 70% of the card and let the bottom breathe deliberately, not accidentally.
- On the cover, pull the badge/title block up and add a bottom-anchored swipe cue, so the card reads top-to-bottom instead of clustering dead-center with empty margins above and below.

### 3b. Real data visuals (new components)
Add to `tokens.css`:
- **`.bar-cmp`** — a two-row horizontal bar comparison. Each row: label + value + a filled bar whose width encodes the number. Coral for the expensive option, teal for the cheap one. This is what card 4 should have been.
- **`.split`** — a full-height two-column contrast card (left = one number/coral, right = other number/teal, a divider between). For "this vs that" moments.
- **`.big-num`** — a hero figure block (reuse `.stat-val` sizing) with an above-label and a below-context line, sized to dominate the card.

### 3c. A statement card style (new)
- **`.card.dark`** — inverted background (`--ink` bg, light text, accent highlight) for the one or two statement/quote cards per carousel. Provides the P4 contrast beat. Use sparingly (max 2 per deck).

### 3d. Save-bait card style (new)
- **`.sheet`** — a bordered, slightly elevated "card-within-the-card" that visually reads as a reference/cheat-sheet: a clear title bar, tight rows, a subtle corner tag ("SAVE THIS"). This is the P3 artifact container. Distinct enough that it looks liftable out of the feed.

### 3e. Usage discipline (no new CSS, just rules)
- The **cost/comparison topic MUST use `.bar-cmp` or `.split`**, never chips, for the headline number.
- Every carousel MUST use `.stat-val`/`.big-num` at least once.
- Every carousel MUST contain exactly one `.sheet` save-bait card.
- At most two `.card.dark` statement cards; at least one per 10 cards for rhythm.

---

## 4. Expanded card-type library

The planner picks from this menu per topic. Types marked **★** are the new/under-used high-impact ones the current output ignores.

| Type | Purpose | Component | Note |
|---|---|---|---|
| Cover | Hook + open loop | `.c1` | Quantified promise, not a topic label |
| Hook | Sharpen the loop | `.c2` | A question the reader silently answers "yes" to |
| Definition | One concept | `.def-box` | Only when a term genuinely needs defining |
| **★ Bar compare** | The money shot | `.bar-cmp` | Replaces text-pill "data" cards |
| **★ Split contrast** | This vs that | `.split` | Two-number face-off |
| **★ Big number** | One stat, huge | `.stat-val`/`.big-num` | The scroll-stopper |
| Steps | How-to | `.si` | Numbered, 3 max |
| Checklist | Actions | `.ai` + `.takeaway` | Candidate for save-bait |
| **★ Cheat-sheet** | Save-bait | `.sheet` | The card people screenshot |
| Do / Don't | Contrast habits | `.cg`/`.cc` | Good, keep |
| Comparison table | Structured data | `.cmp-row` | For sizes/options |
| Routine | Time-of-day plan | `.rb` | Good, keep |
| **★ Statement** | Rhythm beat | `.card.dark` + `.quote` | One bold line, inverted |
| CTA | Save + share + comment | `.c10` | Keep the comment prompt |

---

## 5. Flexible length & structure

Replace the hard `cards_per_carousel: 10` rule with a **range and a required spine**.

- **`config.pipeline.cards_per_carousel`** becomes `card_count_range: [7, 11]` (with a `default_target` the planner aims for but can deviate from with a one-line justification in the plan JSON).
- **Required spine (always present, in order):** Cover → Hook → … → Save-bait (`.sheet`) → CTA. The middle is chosen by the planner to fit the topic.
- **Middle-card selection rule:** the planner assigns card types from the library based on what the *research* actually contains — a cost gap → bar compare + big number; a timing topic → timeline/comparison table; a habits topic → do/don't + checklist. No card exists without a job.
- **Rhythm rule:** no more than two consecutive cards of the same visual weight; at least one statement/`.dark` card breaks up any run of body cards.
- **QA gate change:** `qa-engineer` validates card count is within range (not `== 10`), that the spine is present, that at least one `.stat-val`/`.big-num` and exactly one `.sheet` exist, and that no three consecutive cards share a layout.

---

## 6. Copy & hook strategy (bilingual)

- **Cover headline = a quantified, curiosity-gapped promise.** "Stop Overpaying: The Unit Price Trick" is decent but abstract. Sharper: "The 35c number on every shelf tag — and why it saves $1,200." Lead with the concrete number.
- **Hook card = a yes-question.** "Do you always grab the biggest box?" is on the right track — keep questions the reader answers "yes, that's me" to. That self-recognition is what drives the swipe.
- **Every data claim carries its number inline**, and figures that vary by retailer/time stay marked approximate (per tone guide + brand rules). Keep "no specific brand names."
- **Korean subtitle stays a natural rendering, not literal.** On the new visual cards (bars, big number), the Korean line labels the *same* number compactly — it should never repeat the English length; it sits small and muted.
- **CTA keeps the comment prompt** — it's the one card driving comments, which lift reach. Keep `content.cta_text` exact ("Save this →" / "저장하기").

---

## 7. Worked example — Unit Pricing, redesigned (variable length)

Same topic, restructured to the strategy. **9 cards** instead of a padded 10.

1. **Cover** — "The shelf-tag number nobody reads — worth $1,200." Bottom swipe cue. *(open loop)*
2. **Hook** — "You grab the biggest box to save money, right?" → "Sometimes it's the *most* expensive per change." *(sharpen loop)*
3. **★ Big number** — `$0.35` huge, label "the gap per change between cheapest and priciest", one context line. *(P2)*
4. **★ Bar compare** — two bars: Store brand `$0.15/change` (teal, short) vs Premium `$0.50/change` (coral, long). The visual payoff of the loop. *(P2, resolves the cover promise)*
5. **★ Statement (`.dark`)** — inverted card: "6,000+ changes per baby. Small gaps become $1,200." One line, bold. *(P4 rhythm beat)*
6. **Definition / formula** — "Unit price = box price ÷ number of nappies. That's the only number that matters." Framed as a rule. *(sets up save-bait)*
7. **★ Cheat-sheet (`.sheet`)** — "Before you tap your card" with 4 tight checks + a "SAVE THIS" corner tag. *(P3 — the save)*
8. **Do / Don't** — habits, using existing `.cg`. *(keep)*
9. **CTA** — Save + share + comment prompt. *(keep)*

Cards 5 (routine), 6 (categories), 9 (steps) from the original are cut or merged — they were three ways of saying "use cheap by day, premium by night", which is one idea, not three cards.

---

## 8. Implementation path

Changes, in dependency order. (This doc is the strategy; each item below is a small, reviewable change.)

1. **`tokens.css`** — add `.bar-cmp`, `.split`, `.big-num`, `.card.dark`, `.sheet`. Keep every existing variable; only add.
2. **`html-card/template.html`** — add minimal structure snippets for the new card types so the developer has a reference shell.
3. **`content-planner` agent** — teach it the card-type library (section 4), the required spine, the rhythm rule, and to pick card count from the range based on research density.
4. **`copywriter` agent** — teach it the hook/number-first rules (section 6) and to write the save-bait card as a reference, not prose.
5. **`carousel-developer` agent** — point it at the new components; enforce "cost topic → bar/split, never pills."
6. **`qa-engineer` agent** — update gates to section 5 (range check, spine check, required-component check, rhythm check).
7. **`config.json`** — replace `cards_per_carousel: 10` with `card_count_range: [7, 11]` + `default_target: 9`; update CLAUDE.md/brand-rules quality gates to match.

Each change ships as its own commit (one commit per file, per repo rules).

---

## 9. Success criteria

- No carousel ships as 10 identical body cards; every deck has ≥1 hero number, ≥1 data visual on any numeric topic, and exactly 1 save-bait card.
- The most important number in any carousel is the largest element on its card.
- Card count fits the topic (7–11), justified in the plan JSON.
- Subjective bar: card 1 states a specific promise; card 4-ish visually pays it off; one card is worth screenshotting on its own.
