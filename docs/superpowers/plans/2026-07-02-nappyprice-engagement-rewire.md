# NAPPYPRICE Engagement Rewire — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewire the nappyprice carousel pipeline so output makes the number the hero, contains a save-bait reference card, varies visual weight, and fits card count to the topic (7–11) — per `docs/superpowers/specs/2026-07-02-nappyprice-engagement-strategy.md`.

**Architecture:** Five new CSS components are added to the shared design system (`tokens.css`) and referenced in `template.html`. The four pipeline agents (`content-planner`, `copywriter`, `carousel-developer`, `qa-engineer`) are updated to know a larger card-type library, a required narrative spine, a flexible card-count range, and the new components. `config.json`, `CLAUDE.md`, and `brand-rules.md` are updated so the quality gates match. A stale bug in `qa-engineer` (it still checks the old dark-theme token values) is fixed as part of this work.

**Tech Stack:** Static HTML + CSS (design system in `.claude/skills/html-card/`), Puppeteer screenshotting (`scripts/screenshot.js`), Markdown agent definitions (`.claude/agents/*.md`), JSON config. No build step, no unit-test framework — verification is by rendering HTML and inspecting the screenshot, and by JSON/grep checks.

## Global Constraints

- No emojis anywhere in generated content or components.
- No specific product or brand names in card copy.
- Cite statistics; mark retailer/time-varying figures as approximate.
- CTA text must equal `config.content.cta_text` exactly (`Save this →` / `저장하기`).
- Cards are exactly 1080×1350px, static, stacked, zero `<script>`.
- Bilingual: every text element has an English line + a `.ko-sub` sibling (`.head`/`.body`/`.label`).
- Design tokens are LIGHT theme: `--bg:#FFF7F0`, `--card-bg:#FFFCF9`, `--elevated:#FBF1EA`, `--accent:#FF6F5E` (overridable), `--blue:#1FB6A6` (overridable). Never reintroduce dark values (`#080808`, `#d4ff00`).
- One commit per file (repo rule). No Co-Authored-By trailers.
- Do NOT modify existing `tokens.css` variables or existing class rules — only ADD new rules.

---

## File structure

| File | Responsibility | Change |
|------|----------------|--------|
| `.claude/skills/html-card/tokens.css` | Design-system CSS | ADD 5 component blocks |
| `.claude/skills/html-card/template.html` | Card shell reference | ADD reference snippets for new types |
| `.claude/agents/content-planner.md` | Narrative plan | REWRITE structure section: library, spine, range, rhythm |
| `.claude/agents/copywriter.md` | Card copy | ADD schemas for new types; flexible count; hook/number-first rules |
| `.claude/agents/carousel-developer.md` | HTML build | ADD layout mapping for new types; flexible count; cost→bar rule |
| `.claude/agents/qa-engineer.md` | Quality gates | FIX stale tokens; range check; spine/component/rhythm gates |
| `brands/nappyprice/config.json` | Pipeline params | `card_count_range` + `default_target` |
| `CLAUDE.md` | Project rules | Update quality-gate wording |
| `.claude/rules/brand-rules.md` | Structure rules | Update card-count wording |
| `outputs/nappyprice/.../` proof carousel | Validation artifact | Regenerate unit-pricing deck via the new pipeline |

### Shared vocabulary (used identically by all agents — do not rename)

New `type` strings and their copy schemas (bilingual fields shown as `{en,ko}`; monolingual = plain string):

- **`bar_compare`** — `{ card, type, section_label{en,ko}, headline{en,ko}, bars:[ {label{en,ko}, value{en,ko}, ratio:<0-100 int>, tone:"cost"|"save"}, ... ], caption{en,ko} }`. 2–3 bars. `ratio` = bar fill width %. `tone:"cost"`→coral, `tone:"save"`→teal.
- **`split`** — `{ card, type, left:{value{en,ko}, label{en,ko}, tone:"cost"|"save"}, right:{value{en,ko}, label{en,ko}, tone:"cost"|"save"}, caption{en,ko} }`.
- **`big_number`** — `{ card, type, section_label{en,ko}, value{en,ko}, label{en,ko}, context{en,ko} }`. Renders via existing `.stat-val`.
- **`statement`** — `{ card, type, statement{en,ko} }` (may contain `<strong>`). Renders on `.card.dark`.
- **`sheet`** (save-bait) — `{ card, type, tag{en,ko}, title{en,ko}, rows:[ {en,ko}, ... ], footnote{en,ko} }`. 3–5 rows.

Also ENABLE these already-supported-by-developer types in planner/copywriter: `comparison` (via `.cmp-row`… note: developer currently maps `comparison` to `.cg`; keep that), `stat` is superseded by `big_number` (use `big_number`).

### Required narrative spine (every carousel, in order)

`cover` → `hook` → … middle (planner's choice from the library) … → `sheet` → `cta`.
Card count ∈ [7, 11], default target 9. Rhythm rule: no 3 consecutive cards of the same `type`; ≥1 `statement` (dark) card; ≥1 of {`big_number`,`bar_compare`,`split`} on any numeric topic; exactly one `sheet`.

---

## Task 1: Add the 5 new CSS components to tokens.css

**Files:**
- Modify: `.claude/skills/html-card/tokens.css` (append new rules at end of file, before nothing — it's the last content)
- Test (scratch): `/private/tmp/claude-501/-Users-sophiekwon-projects-aussie-umma/9b4bac17-c784-4aff-87e5-76fff4f03347/scratchpad/component-test.html`

**Interfaces:**
- Produces: CSS classes `.bar-cmp`, `.bar-row`, `.bar-label`, `.bar-track`, `.bar-fill`, `.bar-fill.cost`, `.bar-fill.save`, `.bar-val`; `.split`, `.split-col`, `.split-col.cost`, `.split-col.save`, `.split-v`, `.split-l`, `.split-div`, `.split-cap`; `.big-num` (reuses `.stat-val` sizing); `.card.dark` (+ `.card.dark .quote`, `.card.dark .handle`, `.card.dark .stmt`); `.sheet`, `.sheet-tag`, `.sheet-title`, `.sheet-row`, `.sheet-foot`. Consumed by Tasks 2–6.

- [ ] **Step 1: Append the new component CSS**

Add to the END of `.claude/skills/html-card/tokens.css` (all values reuse existing variables; no new `:root` vars):

```css

/* ===== Bar compare (cost vs save) ===== */
.bar-cmp { margin-top: 48px; display: flex; flex-direction: column; gap: 40px; }
.bar-row { display: flex; flex-direction: column; gap: 14px; }
.bar-label {
  display: flex; align-items: baseline; justify-content: space-between;
  font-size: 30px; font-weight: 700; color: var(--ink);
}
.bar-val { font-family: var(--font-en); font-weight: 900; letter-spacing: -1px; }
.bar-track {
  height: 46px; border-radius: 12px; background: var(--elevated);
  border: 1px solid var(--border); overflow: hidden;
}
.bar-fill { height: 100%; border-radius: 12px 0 0 12px; }
.bar-fill.cost { background: var(--accent); }
.bar-fill.save { background: var(--blue); }

/* ===== Split contrast (this vs that) ===== */
.split { margin-top: 40px; display: flex; align-items: stretch; gap: 0; position: relative; }
.split-col { flex: 1; padding: 48px 40px; text-align: center; }
.split-v {
  font-family: var(--font-display); font-size: 132px; font-weight: 900;
  line-height: 1; letter-spacing: -6px;
}
.split-col.cost .split-v { color: var(--accent); }
.split-col.save .split-v { color: var(--blue); }
.split-l { font-size: 26px; font-weight: 700; color: var(--ink2); margin-top: 20px; }
.split-div { width: 1px; background: var(--border); align-self: stretch; }
.split-cap { text-align: center; font-size: 26px; color: var(--ink2); margin-top: 40px; line-height: 1.55; }

/* ===== Big number (hero figure; reuses .stat-val sizing) ===== */
.big-num { text-align: center; margin: 32px 0; }
.big-num .stat-val { margin: 0 auto; }

/* ===== Dark statement card (rhythm beat) ===== */
.card.dark { background: var(--ink); }
.card.dark .handle { color: var(--card-bg); }
.card.dark .stmt {
  font-size: 60px; font-weight: 800; line-height: 1.3; text-align: center;
  color: var(--card-bg); max-width: 92%; margin: 0 auto; word-break: keep-all;
}
.card.dark .stmt strong { color: var(--accent); font-weight: 900; }
.card.dark .ko-sub { color: rgba(255,252,249,0.55); }

/* ===== Save-bait sheet (screenshot artifact) ===== */
.sheet {
  margin-top: 40px; border-radius: 28px; background: var(--card-bg);
  border: 2px solid var(--ink); padding: 44px 48px; position: relative;
}
.sheet-tag {
  position: absolute; top: -18px; left: 44px; background: var(--accent); color: #000;
  font-family: var(--font-en); font-size: 15px; font-weight: 800; letter-spacing: 3px;
  text-transform: uppercase; padding: 8px 20px; border-radius: 100px;
}
.sheet-title { font-size: 34px; font-weight: 900; color: var(--ink); margin-bottom: 24px; }
.sheet-row {
  display: flex; align-items: flex-start; gap: 18px; padding: 20px 0;
  border-bottom: 1px solid var(--border); font-size: 27px; font-weight: 600;
  color: var(--ink); line-height: 1.5;
}
.sheet-row:last-child { border-bottom: none; }
.sheet-row::before {
  content: "✓"; color: var(--blue); font-weight: 900; font-size: 1.1em; line-height: 1.4;
}
.sheet-foot { margin-top: 24px; font-size: 22px; color: var(--ink3); text-align: center; }
```

Note: the `✓` in `.sheet-row::before` is a CSS content glyph (a checkmark tick), not an emoji in card text — QA's emoji gate scans text content, not CSS. This is allowed.

- [ ] **Step 2: Build a scratch render test**

Write to the scratchpad path `component-test.html`: an HTML doc whose `<head>` has the Google Fonts link and a `<style>` block = the FULL current contents of `tokens.css` (copy verbatim after Step 1). In `<body>`, add five `.card` elements, one exercising each new component with placeholder-but-real content:

```html
<!-- bar_compare -->
<div class="card"><span class="handle">@nappyprice</span><div class="ci"><div class="center-block">
  <div class="tl">THE DATA</div>
  <div class="td md" style="margin-bottom:20px">Cost per change</div>
  <div class="bar-cmp">
    <div class="bar-row"><div class="bar-label"><span>Premium</span><span class="bar-val">$0.50</span></div><div class="bar-track"><div class="bar-fill cost" style="width:100%"></div></div></div>
    <div class="bar-row"><div class="bar-label"><span>Store brand</span><span class="bar-val">$0.15</span></div><div class="bar-track"><div class="bar-fill save" style="width:30%"></div></div></div>
  </div>
</div></div></div>
<!-- split -->
<div class="card"><span class="handle">@nappyprice</span><div class="ci"><div class="center-block">
  <div class="split">
    <div class="split-col cost"><div class="split-v">$0.50</div><div class="split-l">Premium, per change</div></div>
    <div class="split-div"></div>
    <div class="split-col save"><div class="split-v">$0.15</div><div class="split-l">Store brand, per change</div></div>
  </div>
  <div class="split-cap">Same job. Very different price.</div>
</div></div></div>
<!-- big_number -->
<div class="card"><span class="handle">@nappyprice</span><div class="ci"><div class="center-block">
  <div class="tl">THE GAP</div>
  <div class="big-num"><div class="stat-val">$1,200</div><div class="stat-label">saved per year</div><div class="stat-desc">across ~6,000 changes, small per-change gaps add up.</div></div>
</div></div></div>
<!-- statement (dark) -->
<div class="card dark"><span class="handle">@nappyprice</span><div class="ci">
  <div class="stmt">6,000+ changes per baby. <strong>Small gaps become big money.</strong></div>
</div></div>
<!-- sheet -->
<div class="card"><span class="handle">@nappyprice</span><div class="ci"><div class="center-block">
  <div class="sheet"><div class="sheet-tag">Save this</div>
    <div class="sheet-title">Before you tap your card</div>
    <div class="sheet-row">Read the unit price in the shelf-tag corner.</div>
    <div class="sheet-row">Divide box price by nappy count if it's missing.</div>
    <div class="sheet-row">Don't assume the big box wins.</div>
    <div class="sheet-row">Check the per-change price before subscribing.</div>
    <div class="sheet-foot">Compare per change, not per box.</div>
  </div>
</div></div></div>
```

- [ ] **Step 3: Render the scratch test**

Run: `npm run screenshots -- "/private/tmp/claude-501/-Users-sophiekwon-projects-aussie-umma/9b4bac17-c784-4aff-87e5-76fff4f03347/scratchpad/component-test.html"`
Expected: prints `✓ component-test-01.png` … `✓ component-test-05.png` (5 files) into a sibling `images/` dir, no errors.

- [ ] **Step 4: Inspect the 5 PNGs**

Read each PNG (`component-test-01.png`..`05.png`). Verify: bars fill proportionally (premium bar full-width coral, store-brand ~30% teal); split shows two large numbers with a divider; big number is huge and centered; the dark card is dark with light text + coral `<strong>`; the sheet looks like a bordered reference card with a "SAVE THIS" tag and tick rows. If any looks wrong, fix the CSS in `tokens.css` and re-run Step 3.

- [ ] **Step 5: Confirm no existing rules changed**

Run: `git diff .claude/skills/html-card/tokens.css | grep '^-' | grep -v '^---'`
Expected: NO output (only additions, zero deletions — existing rules untouched).

- [ ] **Step 6: Commit**

```bash
git add .claude/skills/html-card/tokens.css
git commit -m "design: add bar-compare, split, big-num, dark, sheet components"
```

---

## Task 2: Add reference snippets for new card types to template.html

**Files:**
- Modify: `.claude/skills/html-card/template.html` (append before the final closing comment/EOF)

**Interfaces:**
- Consumes: classes from Task 1.
- Produces: canonical HTML shells the carousel-developer mirrors. No runtime behavior.

- [ ] **Step 1: Append new-type reference shells**

Add at the end of `.claude/skills/html-card/template.html` (these mirror the scratch test from Task 1, minus placeholder copy, with bilingual `.ko-sub` siblings shown):

```html
<!-- Bar compare (type: bar_compare) — the money shot; use for any cost comparison -->
<div class="card">
  <span class="handle">[BRAND_ACCOUNT]</span>
  <div class="ci"><div class="center-block">
    <div class="tl">[SECTION_LABEL]</div><div class="ko-sub label">[SECTION_LABEL_KO]</div>
    <div class="td md" style="margin-bottom:8px">[HEADLINE]</div><div class="ko-sub head">[HEADLINE_KO]</div>
    <div class="bar-cmp">
      <div class="bar-row"><div class="bar-label"><span>[BAR1_LABEL]</span><span class="bar-val">[BAR1_VALUE]</span></div><div class="bar-track"><div class="bar-fill cost" style="width:[BAR1_RATIO]%"></div></div></div>
      <div class="bar-row"><div class="bar-label"><span>[BAR2_LABEL]</span><span class="bar-val">[BAR2_VALUE]</span></div><div class="bar-track"><div class="bar-fill save" style="width:[BAR2_RATIO]%"></div></div></div>
    </div>
    <p class="tb" style="margin-top:32px">[CAPTION]</p><div class="ko-sub body">[CAPTION_KO]</div>
  </div></div>
</div>

<!-- Split contrast (type: split) — two-number face-off -->
<div class="card">
  <span class="handle">[BRAND_ACCOUNT]</span>
  <div class="ci"><div class="center-block">
    <div class="split">
      <div class="split-col cost"><div class="split-v">[LEFT_VALUE]</div><div class="split-l">[LEFT_LABEL]</div><div class="ko-sub body">[LEFT_LABEL_KO]</div></div>
      <div class="split-div"></div>
      <div class="split-col save"><div class="split-v">[RIGHT_VALUE]</div><div class="split-l">[RIGHT_LABEL]</div><div class="ko-sub body">[RIGHT_LABEL_KO]</div></div>
    </div>
    <div class="split-cap">[CAPTION]</div><div class="ko-sub body" style="text-align:center">[CAPTION_KO]</div>
  </div></div>
</div>

<!-- Big number (type: big_number) — one hero stat -->
<div class="card">
  <span class="handle">[BRAND_ACCOUNT]</span>
  <div class="ci"><div class="center-block">
    <div class="tl">[SECTION_LABEL]</div><div class="ko-sub label">[SECTION_LABEL_KO]</div>
    <div class="big-num">
      <div class="stat-val">[VALUE]</div>
      <div class="stat-label">[LABEL]</div><div class="ko-sub head" style="text-align:center">[LABEL_KO]</div>
      <p class="stat-desc">[CONTEXT]</p><div class="ko-sub body" style="text-align:center">[CONTEXT_KO]</div>
    </div>
  </div></div>
</div>

<!-- Statement (type: statement) — dark rhythm beat; max 2 per carousel -->
<div class="card dark">
  <span class="handle">[BRAND_ACCOUNT]</span>
  <div class="ci">
    <div class="stmt">[STATEMENT_WITH_<strong>BOLD</strong>]</div>
    <div class="ko-sub head" style="text-align:center;margin-top:24px">[STATEMENT_KO]</div>
  </div>
</div>

<!-- Save-bait sheet (type: sheet) — the screenshot artifact; exactly one per carousel -->
<div class="card">
  <span class="handle">[BRAND_ACCOUNT]</span>
  <div class="ci"><div class="center-block">
    <div class="sheet"><div class="sheet-tag">[TAG]</div>
      <div class="sheet-title">[TITLE]</div><div class="ko-sub head">[TITLE_KO]</div>
      <div class="sheet-row">[ROW1]</div><div class="ko-sub body">[ROW1_KO]</div>
      <div class="sheet-row">[ROW2]</div><div class="ko-sub body">[ROW2_KO]</div>
      <div class="sheet-row">[ROW3]</div><div class="ko-sub body">[ROW3_KO]</div>
      <div class="sheet-foot">[FOOTNOTE]</div><div class="ko-sub body" style="text-align:center">[FOOTNOTE_KO]</div>
    </div>
  </div></div>
</div>
```

- [ ] **Step 2: Verify the file still lists all types**

Run: `grep -c 'type: ' .claude/skills/html-card/template.html`
Expected: ≥ 5 (the five new type comments present).

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/html-card/template.html
git commit -m "design: reference shells for bar_compare, split, big_number, statement, sheet"
```

---

## Task 3: Update config, CLAUDE.md, and brand-rules for flexible card count

**Files:**
- Modify: `brands/nappyprice/config.json`
- Modify: `CLAUDE.md`
- Modify: `.claude/rules/brand-rules.md`

**Interfaces:**
- Produces: `config.pipeline.card_count_range: [7,11]`, `config.pipeline.default_target: 9`, `config.pipeline.card_spine`. Consumed by all agents (they read config). Keep `carousels_per_run: 1`.

- [ ] **Step 1: Edit `brands/nappyprice/config.json` pipeline block**

Replace `"pipeline": { "carousels_per_run": 1, "cards_per_carousel": 10 }` with:

```json
  "pipeline": {
    "carousels_per_run": 1,
    "card_count_range": [7, 11],
    "default_target": 9,
    "card_spine": ["cover", "hook", "...", "sheet", "cta"]
  }
```

- [ ] **Step 2: Verify config parses**

Run: `python3 -c "import json; d=json.load(open('brands/nappyprice/config.json')); print(d['pipeline'])"`
Expected: prints the dict including `card_count_range` and `default_target`.

- [ ] **Step 3: Commit config**

```bash
git add brands/nappyprice/config.json
git commit -m "config: nappyprice flexible card count range 7-11, default 9"
```

- [ ] **Step 4: Update `CLAUDE.md` Quality Gates section**

In the "## Quality Gates" section, replace the line
`- Exactly \`pipeline.cards_per_carousel\` cards per HTML file`
with:
```markdown
- Card count within `pipeline.card_count_range` (aim for `pipeline.default_target`)
- The narrative spine is present in order: cover → hook → … → sheet → cta
- Exactly one save-bait `sheet` card; at least one hero number on any numeric topic
```

- [ ] **Step 5: Commit CLAUDE.md**

```bash
git add CLAUDE.md
git commit -m "docs: quality gates reflect flexible card count and spine"
```

- [ ] **Step 6: Update `.claude/rules/brand-rules.md` Structure rules**

Replace the line
`- Exactly \`pipeline.cards_per_carousel\` cards per HTML file — no more, no fewer`
with:
```markdown
- Card count within `pipeline.card_count_range` — fit the format to the topic, never pad
- Required spine in order: cover → hook → … → sheet (save-bait) → cta
- No more than two consecutive cards of the same type; include at least one `statement` (dark) rhythm card
```

- [ ] **Step 7: Commit brand-rules**

```bash
git add .claude/rules/brand-rules.md
git commit -m "docs: brand-rules structure section for flexible count and rhythm"
```

---

## Task 4: Rewrite content-planner for the card-type library, spine, range, rhythm

**Files:**
- Modify: `.claude/agents/content-planner.md`

**Interfaces:**
- Consumes: `config.pipeline` (range, default_target) from Task 3.
- Produces: plan JSON where each card `type` is one of the library strings and the spine + rhythm rules hold. Consumed by copywriter (Task 5) and carousel-developer (Task 6).

- [ ] **Step 1: Replace the input line for card count**

Change the `CARDS_PER_CAROUSEL` input bullet (line ~15) to:
```markdown
- `CARD_COUNT_RANGE` — `[min, max]` allowed cards (default `[7, 11]`)
- `DEFAULT_TARGET` — the card count to aim for unless the topic warrants otherwise (default 9)
```

- [ ] **Step 2: Replace the "## The 10-card narrative structure" section**

Replace the entire section (heading + table through the paragraph before "## Your task") with:

```markdown
## Narrative structure — spine + flexible middle

Choose a card count within `CARD_COUNT_RANGE`, aiming for `DEFAULT_TARGET`. Fit the
format to the topic: a tight tip may want 7 strong cards; a full comparison guide 11.
Never pad. Every card must earn its place.

Required spine, always in this order:

| Position | type | Role |
|----------|------|------|
| first | `cover` | Quantified, curiosity-gapped promise. Lead with the concrete number. |
| second | `hook` | A "that's me" yes-question that sharpens the promise. |
| … middle … | (from library) | Chosen to fit the research. |
| second-last | `sheet` | The save-bait reference card (the screenshot artifact). |
| last | `cta` | Save + share + comment prompt. |

Middle card library — assign `type` from this list based on what the RESEARCH contains.
Use the exact strings:

| type | Use when |
|------|----------|
| `big_number` | One dominant stat carries the insight. Make it the hero. |
| `bar_compare` | A cost/quantity gap between 2–3 options. REQUIRED over `data`/chips for any price gap. |
| `split` | A two-way "this vs that" number face-off. |
| `statement` | A bold one-line truth; renders on a dark card for rhythm. |
| `definition` | A term genuinely needs defining. |
| `routine` | A time-of-day plan (AM/PM/EVE). |
| `categories` | 2–3 approaches to the topic. |
| `steps` | 2–3 numbered how-to steps. |
| `do_dont` | Right vs wrong habits, side by side. |
| `comparison` | Structured option-vs-option rows. |
| `checklist` | Concrete low-effort actions (use only if not already covered by `sheet`). |

Rhythm rules (enforced by QA):
- No three consecutive cards of the same `type`.
- Include at least one `statement` card to break up runs of body cards.
- On any numeric topic, include at least one of `big_number` / `bar_compare` / `split`.
- Exactly one `sheet` card (the spine slot). Do not add a second.

Do NOT invent types outside this table plus the spine types.
```

- [ ] **Step 3: Update "Your task" and output rules**

- In "## Your task", change item 1 to: `1. The exact \`type\` string from the spine or library above — no variations`.
- For `bar_compare`/`split`/`big_number`/`statement`/`sheet`, add to the `content_note`/`layout_hint` guidance a line: `For bar_compare, note which option is the cost (coral) vs save (teal) side and their approximate values; for sheet, list the 3–5 reference rows it should carry.`
- Replace the final paragraph "Return exactly `CARDS_PER_CAROUSEL` card objects…" with:
```markdown
Return between `CARD_COUNT_RANGE[0]` and `CARD_COUNT_RANGE[1]` card objects, aiming for
`DEFAULT_TARGET`. If you deviate from the target, add a top-level `"count_rationale"`
string explaining why (e.g. "topic is a single sharp tip — 7 cards, no padding").
Every card object MUST have a `"type"` field using one of the spine or library strings.
The first two cards MUST be `cover` then `hook`; the last two MUST be `sheet` then `cta`.
```

- [ ] **Step 4: Verify no stale "10" references remain**

Run: `grep -n 'CARDS_PER_CAROUSEL\|10-card\|exactly 10\|always use exactly' .claude/agents/content-planner.md`
Expected: NO output.

- [ ] **Step 5: Commit**

```bash
git add .claude/agents/content-planner.md
git commit -m "agent: content-planner uses card library, spine, flexible count, rhythm"
```

---

## Task 5: Update copywriter with new-type schemas, flexible count, and number-first rules

**Files:**
- Modify: `.claude/agents/copywriter.md`

**Interfaces:**
- Consumes: plan JSON from Task 4 (card `type`s).
- Produces: copy JSON matching the schemas in "Shared vocabulary" above. Consumed by carousel-developer (Task 6).

- [ ] **Step 1: Loosen the fixed-10 language**

- Change "Write final copy for all 10 cards." to "Write final copy for every card the plan contains (7–11 cards; the plan sets the count)."
- Change "Match the emotional arc: empathy (cards 1–2) → insight (cards 3–8) → confidence (cards 9–10)." to "Match the arc: empathy (cover + hook) → insight (the middle) → confidence (sheet + cta)."
- Change the final line "Return ALL 10 cards in a single JSON array." to "Return every card from the plan, in order, in a single JSON array."

- [ ] **Step 2: Add the number-first / hook rules**

After the "## Before you write a single word" section, add:

```markdown
## Make the number the hero

This is a numbers account. Whenever a card carries a figure:
- Put the figure in the field that renders largest (`value` on `big_number`/`split`,
  `bar-val` on `bar_compare`). Keep surrounding words minimal.
- The `cover` headline leads with a concrete number and a curiosity gap
  (e.g. "The 35c shelf-tag number that saves $1,200"), not an abstract label.
- The `hook` question is one the reader silently answers "yes, that's me" to.
- Mark any retailer/time-varying figure approximate. Cite where a stat needs it.
- Korean lines are compact renderings that label the SAME number — never longer than the English.
```

- [ ] **Step 3: Add the new-type schemas**

In "## Per-card schemas (MANDATORY)", after the `data` schema block, insert these schema blocks (bilingual objects when `card.bilingual` true, else plain strings):

````markdown
**bar_compare** — the money shot; use for any cost/quantity gap
```json
{ "card": N, "type": "bar_compare", "section_label": "...", "headline": "...",
  "bars": [
    { "label": "...", "value": "$0.50", "ratio": 100, "tone": "cost" },
    { "label": "...", "value": "$0.15", "ratio": 30, "tone": "save" }
  ],
  "caption": "..." }
```
- `bars`: 2–3 items. `ratio` is an integer 0–100 = bar fill width (largest value = 100).
  `tone`: "cost" (coral) for the expensive option, "save" (teal) for the cheaper one.

**split** — two-number face-off
```json
{ "card": N, "type": "split",
  "left":  { "value": "$0.50", "label": "...", "tone": "cost" },
  "right": { "value": "$0.15", "label": "...", "tone": "save" },
  "caption": "..." }
```

**big_number** — one hero stat
```json
{ "card": N, "type": "big_number", "section_label": "...", "value": "$1,200", "label": "...", "context": "..." }
```
- `value`: the hero figure, short. `label`: what it counts. `context`: one line of why.

**statement** — bold one-line truth on a dark card (rhythm beat)
```json
{ "card": N, "type": "statement", "statement": "...<strong>key part</strong>..." }
```
- One sentence. Wrap the punch in `<strong>`. No section label, no body.

**sheet** — the save-bait reference card
```json
{ "card": N, "type": "sheet", "tag": "Save this", "title": "...", "rows": ["...","...","...","..."], "footnote": "..." }
```
- `tag`: short corner label (keep "Save this" / "저장 필수" style). `rows`: 3–5 short reference lines,
  each a self-contained rule the reader can act on in the aisle. `footnote`: one-line summary rule.
````

- [ ] **Step 4: Verify no stale "10 cards" remains**

Run: `grep -n 'all 10\|10 cards\|ALL 10\|cards 1–8\|cards 9–10\|cards 1–2' .claude/agents/copywriter.md`
Expected: NO output.

- [ ] **Step 5: Commit**

```bash
git add .claude/agents/copywriter.md
git commit -m "agent: copywriter number-first rules, new-type schemas, flexible count"
```

---

## Task 6: Update carousel-developer with new layout mappings and cost→bar rule

**Files:**
- Modify: `.claude/agents/carousel-developer.md`

**Interfaces:**
- Consumes: copy JSON from Task 5; classes from Task 1.
- Produces: HTML using the new components. Consumed by qa-engineer (Task 7) and screenshot.js.

- [ ] **Step 1: Loosen fixed-10 references**

- In "## Design system — non-negotiables" item 1, change "Ten cards stacked vertically" to "All cards (7–11, per the copy JSON) stacked vertically".
- In "## Output", change "All 10 cards in document flow" to "Every card from the copy JSON in document flow".

- [ ] **Step 2: Add rows to the "Card type → layout mapping" table**

Insert these rows into the mapping table (after the `data` row):

```markdown
| `bar_compare` | (default) | `.center-block` | `.tl`, `.td.md` headline, `.bar-cmp` with `.bar-row` items (each `.bar-label` [label + `.bar-val`] + `.bar-track` > `.bar-fill.cost`/`.bar-fill.save` with inline `width:<ratio>%`), `.tb` caption |
| `split` | (default) | `.center-block` | `.split` with two `.split-col.cost`/`.split-col.save` (each `.split-v` value + `.split-l` label) around a `.split-div`, then `.split-cap` |
| `big_number` | (default) | `.center-block` | `.tl`, `.big-num` > `.stat-val` value + `.stat-label` + `.stat-desc` |
| `statement` | `.card.dark` | (none — content centers in `.ci`) | `.stmt` line with `<strong>` for the punch; no `.center-block` |
| `sheet` | (default) | `.center-block` | `.sheet` > `.sheet-tag`, `.sheet-title`, one `.sheet-row` per row, `.sheet-foot` |
```

- [ ] **Step 3: Add the cost→bar non-negotiable and dark-card note**

Append to "## Design system — non-negotiables":
```markdown
7. **Cost gaps use bars, never chips.** Any price/quantity comparison renders as `bar_compare` or `split`. Do NOT use `.chips` to express a cost gap.
8. **Statement cards are dark.** A `statement` card uses `<div class="card dark">` and its `.stmt` content centers directly in `.ci` (no `.center-block`). Use the dark card only for `statement` (max 2 per carousel).
9. **`ratio` drives bar width.** For `bar_compare`, set each `.bar-fill` inline `style="width:<ratio>%"` from the copy JSON `bars[i].ratio`. This is the one allowed inline width; do not invent other inline sizing.
```

- [ ] **Step 4: Add self-check items**

Append to "## Self-check before calling Write":
```markdown
11. Does any cost/price gap render as `bar_compare` or `split` (never `.chips`)?
12. Is there exactly one `sheet` card, and is it the second-to-last card?
13. Do `statement` cards use `<div class="card dark">` with a `.stmt` line (no `.center-block`)?
14. Does each `.bar-fill` have an inline `width:<ratio>%` matching the copy JSON?
```

- [ ] **Step 5: Verify new classes are all referenced**

Run: `grep -o '\.bar-cmp\|\.split\|\.big-num\|card dark\|\.sheet\|\.stmt' .claude/agents/carousel-developer.md | sort -u`
Expected: shows `.bar-cmp`, `.big-num`, `.sheet`, `.split`, `.stmt`, `card dark` present.

- [ ] **Step 6: Commit**

```bash
git add .claude/agents/carousel-developer.md
git commit -m "agent: carousel-developer maps new card types, cost-to-bar rule"
```

---

## Task 7: Fix stale tokens and rewrite quality gates in qa-engineer

**Files:**
- Modify: `.claude/agents/qa-engineer.md`

**Interfaces:**
- Consumes: `config.pipeline` (range) from Task 3; classes from Task 1; HTML from Task 6.
- Produces: pass/fail JSON. Terminal validator; nothing consumes it downstream.

- [ ] **Step 1: FIX the stale dark-theme token gate**

Replace the "Correct token values" checklist line (currently demanding `--card-bg: #080808`, `--accent: #d4ff00`, `--elevated: #0e0e0e`) with:
```markdown
- [ ] **Correct token values** — `--bg: #FFF7F0`, `--card-bg: #FFFCF9`, `--elevated: #FBF1EA`, `--ink: #2B2622`. `--accent`/`--blue` may be overridden by `design.accent_primary`/`design.accent_secondary`. If the file uses OLD dark values (`--card-bg: #080808`, `--accent: #d4ff00`, `--elevated: #0e0e0e`), FAIL — that is the retired dark system.
```

- [ ] **Step 2: Update the card-count gate to a range**

- Change the input bullet `CARDS_PER_CAROUSEL — expected card count` to `CARD_COUNT_RANGE — [min,max] allowed card count (from config.pipeline)`.
- In "### Structure", replace "Exactly `CARDS_PER_CAROUSEL` elements with class `card`" with:
```markdown
- [ ] Card count is within `CARD_COUNT_RANGE` (e.g. 7–11) elements with class `card`
```

- [ ] **Step 3: Add spine, component, and rhythm gates**

Add a new gate block after "### Structure":
```markdown
### Narrative spine & rhythm (new design system)

- [ ] First card is `cover` (`.c1`), second is `hook` (`.c2`), second-to-last is the `sheet` card (`.sheet` present), last is `cta` (`.c10`).
- [ ] Exactly one `.sheet` card in the whole file.
- [ ] On a numeric topic, at least one of `.bar-cmp` / `.split` / `.big-num` (or `.stat-val`) is present.
- [ ] At least one `statement` card: a `<div class="card dark">` with a `.stmt` line. No more than two dark cards.
- [ ] No cost/price gap rendered with `.chips` — cost gaps must use `.bar-cmp` or `.split`.
- [ ] No three consecutive cards with identical layout signature (same primary component).
```

- [ ] **Step 4: Add new classes to the allowed set (do not flag them as invented)**

In the "No invented classes" gate, do NOT add the new classes to the banned list. Add an explicit allow-note:
```markdown
- [ ] **New components are allowed** — `.bar-cmp`, `.bar-row`, `.bar-label`, `.bar-track`, `.bar-fill`, `.bar-val`, `.split`, `.split-col`, `.split-v`, `.split-l`, `.split-div`, `.split-cap`, `.big-num`, `.card.dark`, `.stmt`, `.sheet`, `.sheet-tag`, `.sheet-title`, `.sheet-row`, `.sheet-foot` are valid (defined in tokens.css). Do not flag these as invented.
```
Also update the reference-file list at the top: keep `tokens.css`/`template.html` as authoritative; note `templates/sample.html` will be regenerated in Task 8 and is authoritative only after that.

- [ ] **Step 5: Update the emoji gate to exempt the sheet tick**

In the "No emoji characters" gate, add: "The `✓` produced by `.sheet-row::before` is a CSS glyph, not text content — do not flag it. Only flag emoji in HTML text nodes."

- [ ] **Step 6: Update the pass/fail output examples**

Change the pass example `"card_count": 10` to `"card_count": 9` and add `"spine_ok": true`. Leave the fail example illustrative but replace the stale `--card-bg value is #FFFCF9 but expected #080808` line with `DESIGN SYSTEM: --card-bg is #080808 (retired dark system) — expected #FFFCF9` and the `expected 10, found 9` line with `STRUCTURE: card count 6 is below range [7,11]`.

- [ ] **Step 7: Verify no stale dark values remain as REQUIREMENTS**

Run: `grep -n '#080808\|#d4ff00\|#0e0e0e' .claude/agents/qa-engineer.md`
Expected: matches appear ONLY on lines that describe them as the retired/failing values (Steps 1 and 6), never as the required value.

- [ ] **Step 8: Commit**

```bash
git add .claude/agents/qa-engineer.md
git commit -m "agent: qa-engineer fix stale tokens, range/spine/rhythm gates, allow new classes"
```

---

## Task 8: Regenerate templates/sample.html and the proof carousel

This task validates the whole chain end-to-end by producing a real deck through the new system. It doubles as refreshing the canonical `sample.html` that developer/QA reference.

**Files:**
- Modify: `templates/sample.html` (regenerate as a new-system 9-card example)
- Create: `outputs/nappyprice/2026-07-02/run-1/*` (proof carousel)

**Interfaces:**
- Consumes: everything from Tasks 1–7.

- [ ] **Step 1: Inspect current sample.html theme**

Run: `grep -n '\-\-card-bg\|--accent' templates/sample.html | head`
Expected: reveals whether it's the old dark (`#080808`/`#d4ff00`) or light theme. Record the result. (If already light and new-system-shaped, still regenerate to include ≥1 of each new component.)

- [ ] **Step 2: Build the proof carousel copy JSON by hand**

Using the worked example in the spec (section 7), write `outputs/nappyprice/2026-07-02/run-1/nappy-unit-pricing-copy.json` as a 9-card deck: `cover`, `hook`, `big_number`, `bar_compare`, `statement`, `definition`, `sheet`, `do_dont`, `cta` — all bilingual, all schema-correct per Task 5. (This is a manual stand-in for the planner+copywriter; it exercises the developer + QA + screenshot chain.)

- [ ] **Step 3: Build the HTML via the carousel-developer rules**

Following the updated `carousel-developer.md`, write `outputs/nappyprice/2026-07-02/run-1/nappy-unit-pricing.html`: full `tokens.css` inline (with `--accent:#FF6F5E`, `--blue:#1FB6A6`), Google Fonts link, 9 stacked cards, bilingual `.ko-sub` on every text element, `statement` on a `.card.dark`, the cost gap as `bar_compare`, one `sheet`.

- [ ] **Step 4: Render it**

Run: `npm run screenshots -- outputs/nappyprice/2026-07-02/run-1/nappy-unit-pricing.html`
Expected: `✓ nappy-unit-pricing-01.png` … `-09.png` (9 files), no errors.

- [ ] **Step 5: Inspect all 9 PNGs against the strategy**

Read the 9 PNGs. Confirm: cover states a specific number promise; a hero number card exists; the cost gap is a proportional bar (not pills); one dark statement card breaks the rhythm; the sheet reads as a screenshot-worthy reference with a "SAVE THIS" tag; no card is empty dead-center. Fix HTML and re-render if any fail.

- [ ] **Step 6: Run the QA gates mentally/by checklist against the file**

Walk `nappy-unit-pricing.html` through the updated `qa-engineer.md` gates: light tokens, count in [7,11], spine order (cover/hook/…/sheet/cta), exactly one sheet, ≥1 hero-number/bar, 1–2 dark cards, no chips for the cost gap, bilingual complete. Record pass. Fix and re-render on any fail.

- [ ] **Step 7: Regenerate templates/sample.html**

Copy the validated `nappy-unit-pricing.html` structure into `templates/sample.html` as the canonical example (it now demonstrates the spine + all new components on the light theme). Keep it self-contained.

- [ ] **Step 8: Verify sample renders**

Run: `npm run screenshots -- templates/sample.html`
Expected: 9 `✓ sample-*.png` lines, no errors. (Screenshots land in `templates/images/`; delete that scratch dir afterward — it is not committed.)

- [ ] **Step 9: Commit sample, then the proof carousel files (one commit per file)**

```bash
git add templates/sample.html
git commit -m "template: regenerate sample.html on new light design system"
git add outputs/nappyprice/2026-07-02/run-1/nappy-unit-pricing-copy.json
git commit -m "carousel: nappyprice unit-pricing copy (new system proof)"
git add outputs/nappyprice/2026-07-02/run-1/nappy-unit-pricing.html
git commit -m "carousel: nappyprice unit-pricing html (new system proof)"
```
Then commit each PNG in `outputs/nappyprice/2026-07-02/run-1/images/` individually (repo rule: one commit per file):
```bash
for f in outputs/nappyprice/2026-07-02/run-1/images/nappy-unit-pricing-*.png; do
  git add "$f" && git commit -m "carousel: asset $(basename "$f")"
done
```

---

## Self-review (author checklist — completed)

**Spec coverage:** P1 loops → planner spine + cover/hook copy rules (T4,T5). P2 number-hero → `big_number`/`bar_compare`/`split` components + copy number-first rules + developer cost→bar rule + QA gate (T1,T5,T6,T7). P3 save-bait → `sheet` component + schema + spine slot + QA "exactly one sheet" (T1,T4,T5,T7). P4 visual weight → `.card.dark` statement + rhythm rules + QA no-3-consecutive gate (T1,T4,T7). P5 flexible format → config range + all agents + QA range gate (T3–T7). §3 visuals → T1. §4 library → T4/T6. §5 length+gates → T3,T7. §6 copy → T5. §7 example → T8. §8 implementation path → this whole plan. §9 success criteria → T8 inspection steps.

**Placeholder scan:** No TBD/TODO; CSS and schema blocks are concrete; `[BRACKET]` tokens in template.html are intentional reference placeholders (that file is a template), consistent with the existing file's style.

**Type consistency:** `bar_compare`/`split`/`big_number`/`statement`/`sheet` and their fields (`bars`,`ratio`,`tone`,`value`,`label`,`context`,`statement`,`tag`,`rows`,`footnote`) are defined once in "Shared vocabulary" and used identically in copywriter schema (T5), developer mapping (T6), and QA gates (T7). CSS class names in T1 match those referenced in T2/T6/T7.
```
