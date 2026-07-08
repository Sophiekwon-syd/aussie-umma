# nappyprice Multi-Brand Monorepo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the single-brand `aussie-umma` carousel repo into a multi-brand monorepo with `nappyprice` (bilingual EN/KO, light palette) as the active brand and `aussie-umma` kept as a dormant archive.

**Architecture:** Each brand lives in `brands/<brand>/` (its own `config.json`, `tone-guide.md`, `topic-memory.json`); outputs live under `outputs/<brand>/`. A `BRAND` argument threads through the `/daily-run` command, the orchestrator, every specialist agent, the screenshot flow, and the Instagram poster. The shared design system (`.claude/skills/html-card/`) is re-themed to nappyprice's light bilingual look; aussie-umma's already-generated HTML/PNGs are frozen archives and are never regenerated.

**Tech Stack:** Markdown agent definitions, JSON config, HTML/CSS card template, Node.js (ESM) scripts with `node:test`, GitHub Actions, Puppeteer (Chrome) for screenshots.

## Global Constraints

- Active brand default everywhere: `nappyprice`.
- Brand state path: `brands/<brand>/{config.json,tone-guide.md,topic-memory.json}`.
- Output path: `outputs/<brand>/YYYY-MM-DD/run-N/` (+ `images/`).
- Exactly `pipeline.cards_per_carousel` (10) cards per carousel; each card 1080×1350px.
- `pipeline.carousels_per_run` = 1.
- No emojis anywhere in generated content. No product/brand names in card copy. Cite statistics.
- nappyprice cards are bilingual: English primary (large) + Korean subtitle (small, muted) directly beneath, on headline AND body. Driven by `config.card.bilingual`.
- Palette (tokens.css `:root`): bg `#FFF7F0`, card-bg `#FFFCF9`, elevated `#FBF1EA`, ink `#2B2622`, ink2 `#6B625B`, ink3/muted `#A89E95`, ink4 `#E7DCD2`, accent coral `#FF6F5E`, blue→teal `#1FB6A6`, red `#E5484D`, border `rgba(43,35,32,0.08)`. Fonts: Space Grotesk (English), Noto Sans KR (Korean).
- Handle top-right on every card; no footer; no carousel dots; no page-number watermark.
- CTA: `{ "en": "Save this →", "ko": "저장하기" }`.
- Git: the project rule "one commit per file" targets generated carousel assets. For this refactor, commit each modified/created source file in its own commit (no bundling); the single exception is the bulk `outputs/` relocation, committed as one move. No `Co-Authored-By` trailers.
- Do NOT commit `node_modules/` or `.cache/`.

---

### Task 1: Safety snapshot and discard throwaway run

**Files:**
- No source files. Git operations only.

- [ ] **Step 1: Confirm the only uncommitted work is the throwaway 2026-06-28 aussie-umma run**

Run: `git status --short`
Expected: only `outputs/2026-06-28/...` (untracked) appears; nothing else uncommitted.

- [ ] **Step 2: Tag the current committed state as an archive point**

```bash
git tag aussie-umma-archive
git tag --list aussie-umma-archive
```
Expected: prints `aussie-umma-archive`.

- [ ] **Step 3: Discard the throwaway 2026-06-28 run**

```bash
rm -rf outputs/2026-06-28
git status --short
```
Expected: `outputs/2026-06-28` no longer listed; working tree clean.

---

### Task 2: Migrate aussie-umma into a brand slot

**Files:**
- Move: `config.json` → `brands/aussie-umma/config.json`
- Move: `tone-guide.md` → `brands/aussie-umma/tone-guide.md`
- Move: `topic-memory.json` → `brands/aussie-umma/topic-memory.json`
- Move: `outputs/2026-*/` → `outputs/aussie-umma/2026-*/`
- Modify: `brands/aussie-umma/config.json` (add `card` block)

**Interfaces:**
- Produces: the path convention `brands/aussie-umma/config.json` and `outputs/aussie-umma/<date>/...` that later tasks and the dormant brand rely on.

- [ ] **Step 1: Create brand directory and move aussie-umma config files (preserve history)**

```bash
mkdir -p brands/aussie-umma
git mv config.json brands/aussie-umma/config.json
git mv tone-guide.md brands/aussie-umma/tone-guide.md
git mv topic-memory.json brands/aussie-umma/topic-memory.json
```

- [ ] **Step 2: Add the single-language card block to aussie-umma config**

In `brands/aussie-umma/config.json`, add a top-level `"card"` key (after `"design"`):
```json
  "card": { "bilingual": false, "primary": "Korean" },
```

- [ ] **Step 3: Relocate existing outputs under the brand namespace**

```bash
mkdir -p outputs/aussie-umma
for d in outputs/2026-*; do git mv "$d" "outputs/aussie-umma/$(basename "$d")"; done
ls outputs/aussie-umma | head
```
Expected: the dated directories (`2026-05-15` … `2026-06-13`) now live under `outputs/aussie-umma/`.

- [ ] **Step 4: Commit the migration**

```bash
git add -A
git commit -m "refactor: move aussie-umma into brands/ slot and namespace outputs"
```

---

### Task 3: Create the nappyprice brand slot

**Files:**
- Create: `brands/nappyprice/config.json`
- Create: `brands/nappyprice/tone-guide.md`
- Create: `brands/nappyprice/topic-memory.json`

**Interfaces:**
- Produces: `brands/nappyprice/config.json` with keys `brand`, `content` (incl. `cta_text` object), `design.accent_primary`/`accent_secondary`, `card.bilingual`, `pipeline`; consumed by every pipeline agent and the poster.

- [ ] **Step 1: Write `brands/nappyprice/config.json`**

```json
{
  "brand": { "name": "NAPPYPRICE", "account": "@nappyprice" },

  "content": {
    "niche": "Helping parents in Australia cut the cost of nappies, wipes, and baby essentials. Practical, numbers-driven money-saving tips. Cards are bilingual: English primary with a smaller Korean subtitle.",
    "target_audience": "Budget-conscious parents of babies and toddlers living in Australia. Korean-speaking parents are a core segment, so every card carries a Korean subtitle beneath the English.",
    "tone": "A savvy, friendly deal-finding friend. Upbeat, concrete, never preachy. Lead with the practical tip, back it with a real number, end with a clear next step.",
    "topics_to_avoid": [
      "Medical or safety claims about specific products",
      "Naming or criticising specific brands or retailers in card copy",
      "Sponsored or affiliate-style framing",
      "Time-sensitive live prices or current deals (deferred to phase 2)",
      "Any tip whose accuracy depends on a price that changes week to week"
    ],
    "recurring_themes": [
      "Cost-per-use / cost-per-change comparison",
      "Wipes value and bulk-buying",
      "Subscribe-and-save and sale-cycle timing",
      "Reusable vs disposable trade-offs",
      "Baby-essential starter checklists on a budget",
      "Avoiding common overspending traps"
    ],
    "search_contexts": [
      "Australian nappy and wipes pricing trends and cost-per-use analysis",
      "Major Australian retailer baby-product sale cycles and timing",
      "Reusable vs disposable nappy total-cost comparisons in Australia",
      "Parenting forums and groups: how Australian parents save on nappies and wipes",
      "Baby essentials budgeting guides for new Australian parents"
    ],
    "hashtags": "#nappyprice #babyonabudget #aussieparents #nappies #babyessentials #호주육아 #호주맘 #육아템",
    "cta_text": { "en": "Save this →", "ko": "저장하기" }
  },

  "design": { "theme": "light-friendly", "accent_primary": "#FF6F5E", "accent_secondary": "#1FB6A6" },

  "card": { "bilingual": true, "primary": "English", "subtitle": "Korean" },

  "pipeline": { "carousels_per_run": 1, "cards_per_carousel": 10 }
}
```

- [ ] **Step 2: Write `brands/nappyprice/tone-guide.md`**

```markdown
# Tone Guide — NAPPYPRICE

The copywriter reads this file in full before writing. Cards are bilingual:
English is the primary voice; the Korean line is a smaller subtitle beneath it.

## Voice (English — primary)

We write like a savvy friend who is great at finding value. We are practical and
upbeat, never preachy or salesy. We respect that money is tight and time is
shorter. We explain the "why" in one line, then give the move.

## Sentence Style (English)

- Short, concrete sentences. One idea per card.
- Lead with the takeaway, then the reason.
- Use real numbers and plain comparisons ("per change", "per 100 wipes").
- Friendly openers are fine ("Here's the trick:", "Quick one:").

## Korean subtitle rules

- The Korean line is a natural, concise rendering of the English meaning — NOT a
  literal word-for-word translation. It should read like a Korean parent talking.
- Keep it short: it sits small and muted under the English line.
- Polite-casual register ("~해요", "~보세요"). No emojis. No English mixed in.

## Words to Use (English)

- "per change", "per nappy", "per 100 wipes", "cost per use"
- "worth it when…", "skip it if…", "the sweet spot is…"
- "stock up", "wait for", "check the unit price"

## Words to Avoid

- Hype: "amazing deal", "you must", "never pay full price again"
- Absolutes without a source. Cite any statistic.
- Fear or urgency framing.

## Emotional Register

Build across the 10 cards: relatable problem (1-2) → useful insight (3-8) →
confident, doable next step (9-10). Calm and encouraging, never alarmist.

## Hard Rules

- No emojis.
- Cite statistics; mark figures that vary by retailer/time as approximate.
- No specific product or brand names in copy.
- Assume every family's situation differs.
```

- [ ] **Step 3: Write an empty `brands/nappyprice/topic-memory.json`**

```json
{
  "used": []
}
```

- [ ] **Step 4: Commit each new file separately**

```bash
git add brands/nappyprice/config.json && git commit -m "config: add nappyprice brand config"
git add brands/nappyprice/tone-guide.md && git commit -m "config: add nappyprice tone guide"
git add brands/nappyprice/topic-memory.json && git commit -m "config: add nappyprice topic memory"
```

---

### Task 4: Re-theme the shared design system + bilingual support

**Files:**
- Modify: `.claude/skills/html-card/tokens.css:7-23` (`:root`), `:32` (body background), `:33` (body font), `:46` (card radial), `:58` (noise opacity)
- Modify: `.claude/skills/html-card/tokens.css` (append Korean-subtitle classes)
- Modify: `.claude/skills/html-card/template.html` (bilingual structure notes + Google Fonts)

**Interfaces:**
- Produces: CSS classes `.ko-sub.head`, `.ko-sub.body`, `.ko-sub.label` consumed by carousel-developer for bilingual rendering; a re-themed `:root` palette consumed by every generated card.

- [ ] **Step 1: Replace the `:root` block (lines 7-23) with the light palette**

```css
:root {
  --bg: #FFF7F0;
  --card-bg: #FFFCF9;
  --elevated: #FBF1EA;
  --ink: #2B2622;
  --ink2: #6B625B;
  --ink3: #A89E95;
  --ink4: #E7DCD2;
  --accent: #FF6F5E;           /* coral */
  --accent-dim: rgba(255, 111, 94, 0.14);
  --blue: #1FB6A6;             /* teal (savings/secondary) */
  --red: #E5484D;
  --border: rgba(43, 35, 32, 0.08);
  --font-kr: "Noto Sans KR", sans-serif;
  --font-en: "Space Grotesk", sans-serif;
  --font-display: "Space Grotesk", "Noto Sans KR", sans-serif;
}
```

- [ ] **Step 2: Light-mode fixes in body and card**

In `body` (line ~32-33): change `background: #000000;` to `background: var(--bg);` and `font-family: var(--font-kr);` to `font-family: var(--font-en);`.

In `.card` (line ~46): change
`background-image: radial-gradient(circle at 50% 50%, #111 0%, var(--card-bg) 70%);`
to `background-image: none;`

In `.card::before` (line ~58): change `opacity: 0.05;` to `opacity: 0;` (drop the dark noise texture on the light background).

- [ ] **Step 3: Append the Korean-subtitle classes at the end of tokens.css**

```css

/* ===== Bilingual: Korean subtitle (small, muted, beneath the English line) ===== */
.ko-sub {
  font-family: var(--font-kr);
  color: var(--ink3);
  font-weight: 400;
  word-break: keep-all;
}
.ko-sub.label { font-size: 17px; letter-spacing: 1px; margin-top: 2px; margin-bottom: 44px; }
.ko-sub.head  { font-size: 30px; line-height: 1.45; margin-top: 18px; }
.ko-sub.body  { font-size: 21px; line-height: 1.45; margin-top: 8px; }
```

- [ ] **Step 4: Add bilingual guidance + Google Fonts to template.html**

At the top comment of `.claude/skills/html-card/template.html`, add a "BILINGUAL RULE" note and a fonts reminder:
```html
<!--
  BILINGUAL RULE (when the brand's config.card.bilingual is true):
  After each English text element, add a sibling Korean subtitle:
    headline:  <div class="td md">English…</div><div class="ko-sub head">한국어…</div>
    section label: <div class="tl">LABEL</div><div class="ko-sub label">한국어 라벨</div>
    body line/item: <div class="ap-d">English…</div><div class="ko-sub body">한국어…</div>
  The copy JSON supplies each field as { "en": "...", "ko": "..." }.
  When config.card.bilingual is false, render English/primary only (no .ko-sub).

  FONTS: every generated .html must include in <head>:
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Noto+Sans+KR:wght@400;500;700&display=swap" rel="stylesheet">
-->
```

- [ ] **Step 5: Render the approved sample to confirm the theme compiles**

Build a one-card smoke test using the new tokens (reuse the structure from the brainstorming sample), then:
```bash
CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" node scripts/screenshot.js <smoke-test>.html
```
Expected: one 1080×1350 PNG on a cream background with coral/teal accents and a muted Korean subtitle under the English headline. (Delete the smoke-test file/PNG before committing.)

- [ ] **Step 6: Commit each file separately**

```bash
git add .claude/skills/html-card/tokens.css && git commit -m "design: re-theme card tokens to nappyprice light palette + bilingual classes"
git add .claude/skills/html-card/template.html && git commit -m "design: document bilingual card structure and fonts"
```

---

### Task 5: Update brand-rules and CLAUDE.md for multi-brand

**Files:**
- Modify: `.claude/rules/brand-rules.md`
- Modify: `CLAUDE.md`

**Interfaces:**
- Produces: the documented `brands/<BRAND>/` first-step contract and the bilingual language rule that all agents follow.

- [ ] **Step 1: Update brand-rules.md language + path rules**

Replace the "Do not mix languages within a card" bullet with:
```markdown
- Follow the brand's `card` language config in `config.json`. When `card.bilingual`
  is true, render `card.primary` large and `card.subtitle` small and muted directly
  beneath it (English headline + Korean subtitle). When false, render the primary
  language only.
```
Replace the rule "always read `config.json` → `content.topics_to_avoid`" and any
bare `config.json` / `tone-guide.md` references so they point to
`brands/<BRAND>/config.json` and `brands/<BRAND>/tone-guide.md`.
Update the file rule line about tracked files to:
`outputs/`, `brands/*/config.json`, `brands/*/tone-guide.md`, and `brands/*/topic-memory.json` ARE tracked.

- [ ] **Step 2: Update CLAUDE.md first-step and structure**

In CLAUDE.md "First Step" section, change the two files to:
```markdown
- `brands/<BRAND>/config.json` — brand identity, content niche, design, pipeline params
- `brands/<BRAND>/tone-guide.md` — voice, sentence style, words to use/avoid
```
Add a short "## Brands" section:
```markdown
## Brands

This repo hosts multiple brands. Each lives in `brands/<brand>/` with its own
`config.json`, `tone-guide.md`, and `topic-memory.json`. Outputs go to
`outputs/<brand>/YYYY-MM-DD/run-N/`.

- Active brand: **nappyprice** (bilingual EN/KO). Default for `/daily-run`.
- Dormant archive: **aussie-umma** (Korean only; not scheduled).

Run a specific brand with `/daily-run <brand>` (defaults to `nappyprice`).
```
Update the "Directory Structure" section to show `brands/` and `outputs/<brand>/`.

- [ ] **Step 3: Commit each file separately**

```bash
git add .claude/rules/brand-rules.md && git commit -m "rules: multi-brand paths and bilingual language rule"
git add CLAUDE.md && git commit -m "docs: multi-brand structure and default brand"
```

---

### Task 6: Make the orchestrator and /daily-run command brand-aware

**Files:**
- Modify: `.claude/commands/daily-run.md`
- Modify: `.claude/agents/orchestrator.md`

**Interfaces:**
- Consumes: `brands/<brand>/config.json`, `brands/<brand>/tone-guide.md`, `brands/<brand>/topic-memory.json`.
- Produces: a `BRAND` value passed to every specialist agent; outputs at `outputs/<brand>/<date>/run-N/`.

- [ ] **Step 1: Update the /daily-run command to accept a brand argument**

In `.claude/commands/daily-run.md`, state that the command takes an optional brand
argument defaulting to `nappyprice`, and that it reads `brands/<BRAND>/config.json`
and `brands/<BRAND>/topic-memory.json` (not root). Update the step list to write to
`outputs/<BRAND>/YYYY-MM-DD/run-log.json`.

- [ ] **Step 2: Update the orchestrator to resolve and propagate BRAND**

In `.claude/agents/orchestrator.md`:
- Read `BRAND` from its prompt (default `nappyprice`).
- Read `brands/<BRAND>/config.json`, `brands/<BRAND>/tone-guide.md`,
  `brands/<BRAND>/topic-memory.json` as the source of truth.
- Pass `BRAND` and the resolved file paths to every specialist agent it dispatches.
- Write all outputs under `outputs/<BRAND>/<date>/run-N/`.
- After assets, update `brands/<BRAND>/topic-memory.json` (not root) and write
  `outputs/<BRAND>/<date>/run-N/run-log.json`.

- [ ] **Step 3: Verify references are consistent**

Run: `grep -rn "config.json\|topic-memory.json\|outputs/" .claude/commands/daily-run.md .claude/agents/orchestrator.md`
Expected: every path is brand-scoped (`brands/<BRAND>/…` or `outputs/<BRAND>/…`); no bare root `config.json`/`topic-memory.json` remain.

- [ ] **Step 4: Commit each file separately**

```bash
git add .claude/commands/daily-run.md && git commit -m "command: daily-run takes a brand argument (default nappyprice)"
git add .claude/agents/orchestrator.md && git commit -m "agent: orchestrator resolves and propagates BRAND"
```

---

### Task 7: Update specialist agents (paths + bilingual)

**Files:**
- Modify: `.claude/agents/trend-researcher.md`
- Modify: `.claude/agents/topic-researcher.md`
- Modify: `.claude/agents/content-planner.md`
- Modify: `.claude/agents/copywriter.md`
- Modify: `.claude/agents/carousel-developer.md`
- Modify: `.claude/agents/qa-engineer.md`
- Modify: `.claude/agents/asset-producer.md`

**Interfaces:**
- Consumes: `BRAND` + brand config paths from the orchestrator.
- Produces: copy JSON whose text fields are `{ "en": "...", "ko": "..." }` when `card.bilingual` is true (consumed by carousel-developer and qa-engineer).

- [ ] **Step 1: Path-scope the research/planning agents**

In trend-researcher, topic-researcher, content-planner: replace any root
`config.json` / `topic-memory.json` references with `brands/<BRAND>/config.json` and
`brands/<BRAND>/topic-memory.json`, and write intermediate JSON under
`outputs/<BRAND>/<date>/run-N/`. trend-researcher reads `search_contexts` and
`topics_to_avoid` from the brand config and excludes topics already in the brand's
`topic-memory.json` (30-day window).

- [ ] **Step 2: Make the copywriter produce bilingual copy**

In `.claude/agents/copywriter.md`:
- Read `brands/<BRAND>/tone-guide.md` and `brands/<BRAND>/config.json`.
- When `config.card.bilingual` is true, every text field in the copy JSON is an
  object `{ "en": "...", "ko": "..." }`. English is the primary voice; Korean is a
  concise, natural (non-literal) subtitle. When false, fields are plain strings.
- Document the per-card schema with a concrete example, e.g.:
```json
{
  "type": "checklist",
  "section_label": { "en": "Nappy savings", "ko": "기저귀 절약" },
  "headline": { "en": "Compare by cost per change", "ko": "한 장당 가격으로 비교하세요" },
  "items": [
    { "en": "A bigger box isn't always cheaper per nappy.", "ko": "큰 박스가 항상 한 장당 더 싼 건 아니에요." }
  ]
}
```
- CTA copy uses `config.content.cta_text.en` / `.ko`.

- [ ] **Step 3: Make the carousel-developer render bilingual + new design**

In `.claude/agents/carousel-developer.md`:
- Paste `.claude/skills/html-card/tokens.css` verbatim; override `--accent` with
  `design.accent_primary` and `--blue` with `design.accent_secondary`.
- Include the Google Fonts `<link>` (Space Grotesk + Noto Sans KR) in `<head>`.
- When `config.card.bilingual` is true, for each English text element emit a sibling
  `.ko-sub` with the right size class (`head` under headlines, `body` under body
  text/items, `label` under section labels), per the template.html bilingual rule.
- Consume `{ en, ko }` copy fields. Write the HTML to
  `outputs/<BRAND>/<date>/run-N/<slug>.html`.

- [ ] **Step 4: Extend qa-engineer checks**

In `.claude/agents/qa-engineer.md`: keep existing gates (exactly 10 cards,
1080×1350, no emojis, fonts present, passes before screenshots). Add: when
`config.card.bilingual` is true, every text element must have both an English line
and a `.ko-sub` Korean line (no missing `en`/`ko`). Read the brand config to know
whether bilingual applies. Validate the file at `outputs/<BRAND>/<date>/run-N/`.

- [ ] **Step 5: Path-scope the asset-producer**

In `.claude/agents/asset-producer.md`: screenshot the validated HTML at
`outputs/<BRAND>/<date>/run-N/<slug>.html` into
`outputs/<BRAND>/<date>/run-N/images/` (10 PNGs, `<slug>-NN.png`).

- [ ] **Step 6: Verify no bare root paths remain in agents**

Run: `grep -rn "config.json\|tone-guide.md\|topic-memory.json\|outputs/" .claude/agents/ | grep -v "brands/<BRAND>" | grep -v "outputs/<BRAND>"`
Expected: no output (every reference is brand-scoped). Placeholder tokens like
`<BRAND>` are acceptable.

- [ ] **Step 7: Commit each agent file separately**

```bash
for f in trend-researcher topic-researcher content-planner copywriter carousel-developer qa-engineer asset-producer; do
  git add ".claude/agents/$f.md" && git commit -m "agent: make $f brand-aware (paths + bilingual where relevant)"
done
```

---

### Task 8: Brand-aware Instagram poster (with tests)

**Files:**
- Modify: `scripts/post-to-instagram.mjs`
- Create: `scripts/post-to-instagram.helpers.mjs`
- Create: `scripts/post-to-instagram.test.mjs`

**Interfaces:**
- Produces (in helpers): `brandEnvKey(brand) -> string`, `resolveBrandSecrets(brand, env) -> { token, userId }`, `formatCta(cta) -> string`. Consumed by `post-to-instagram.mjs`.

- [ ] **Step 1: Write failing tests for the pure helpers**

Create `scripts/post-to-instagram.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { brandEnvKey, resolveBrandSecrets, formatCta } from './post-to-instagram.helpers.mjs';

test('brandEnvKey uppercases and replaces hyphens', () => {
  assert.equal(brandEnvKey('nappyprice'), 'NAPPYPRICE');
  assert.equal(brandEnvKey('aussie-umma'), 'AUSSIE_UMMA');
});

test('resolveBrandSecrets prefers brand-suffixed vars', () => {
  const env = {
    IG_ACCESS_TOKEN_NAPPYPRICE: 'brandtok',
    IG_USER_ID_NAPPYPRICE: 'branduid',
    IG_ACCESS_TOKEN: 'fallbacktok',
    IG_USER_ID: 'fallbackuid',
  };
  assert.deepEqual(resolveBrandSecrets('nappyprice', env), { token: 'brandtok', userId: 'branduid' });
});

test('resolveBrandSecrets falls back to unsuffixed vars', () => {
  const env = { IG_ACCESS_TOKEN: 'fallbacktok', IG_USER_ID: 'fallbackuid' };
  assert.deepEqual(resolveBrandSecrets('nappyprice', env), { token: 'fallbacktok', userId: 'fallbackuid' });
});

test('formatCta handles object and string', () => {
  assert.equal(formatCta({ en: 'Save this →', ko: '저장하기' }), 'Save this →\n저장하기');
  assert.equal(formatCta('저장하기 →'), '저장하기 →');
  assert.equal(formatCta(undefined), '');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test scripts/post-to-instagram.test.mjs`
Expected: FAIL — cannot find module `./post-to-instagram.helpers.mjs`.

- [ ] **Step 3: Implement the helpers**

Create `scripts/post-to-instagram.helpers.mjs`:
```js
export function brandEnvKey(brand) {
  return String(brand).toUpperCase().replace(/-/g, '_');
}

export function resolveBrandSecrets(brand, env) {
  const key = brandEnvKey(brand);
  return {
    token: env[`IG_ACCESS_TOKEN_${key}`] || env.IG_ACCESS_TOKEN,
    userId: env[`IG_USER_ID_${key}`] || env.IG_USER_ID,
  };
}

export function formatCta(cta) {
  if (!cta) return '';
  if (typeof cta === 'string') return cta;
  return [cta.en, cta.ko].filter(Boolean).join('\n');
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test scripts/post-to-instagram.test.mjs`
Expected: PASS (4 tests).

- [ ] **Step 5: Wire the helpers + brand into post-to-instagram.mjs**

Edit `scripts/post-to-instagram.mjs`:
- Add import: `import { resolveBrandSecrets, formatCta } from './post-to-instagram.helpers.mjs';`
- Parse args first, then derive brand: `const brand = args.brand || 'nappyprice';`
- Replace the `IG_TOKEN`/`IG_USER_ID` constants (lines ~6-7) with:
  `const { token: IG_TOKEN, userId: IG_USER_ID } = resolveBrandSecrets(brand, process.env);`
- Update the `REPO` fallback (line 8) to `'Sophiekwon-syd/nappyprice'`.
- Change `config` load to `brands/<brand>/config.json`:
  `const config = JSON.parse(await fs.readFile(path.join('brands', brand, 'config.json'), 'utf8'));`
- Change `baseDir` (line ~22) to `path.join('outputs', brand, date)`.
  (Image URLs build from `runDir`, which now includes the brand — no other URL change needed.)
- In `buildCaption`, replace `const cta = config.content?.cta_text || '';` with
  `const cta = formatCta(config.content?.cta_text);` and replace the hardcoded
  `tags` line with `const tags = config.content?.hashtags || '';`.

- [ ] **Step 6: Smoke-check the script wiring (no real posting)**

Run: `node -e "import('./scripts/post-to-instagram.helpers.mjs').then(m=>console.log(m.resolveBrandSecrets('nappyprice',{IG_ACCESS_TOKEN:'t',IG_USER_ID:'u'})))"`
Expected: `{ token: 't', userId: 'u' }`.

- [ ] **Step 7: Commit each file separately**

```bash
git add scripts/post-to-instagram.helpers.mjs && git commit -m "post: add brand-aware secret/cta helpers"
git add scripts/post-to-instagram.test.mjs && git commit -m "test: cover post-to-instagram helpers"
git add scripts/post-to-instagram.mjs && git commit -m "post: make Instagram poster brand-aware"
```

---

### Task 9: Update CI workflows

**Files:**
- Modify: `.github/workflows/daily-run.yml`
- Modify: `.github/workflows/post-to-instagram.yml`

**Interfaces:**
- Consumes: `/daily-run nappyprice`, `brands/*/topic-memory.json`, `--brand nappyprice`.

- [ ] **Step 1: Update daily-run.yml**

- Change the run step command to: `claude --dangerously-skip-permissions -p "/daily-run nappyprice"`.
- Change the commit `git add` line from `outputs/ topic-memory.json` to
  `outputs/ brands/*/topic-memory.json`.

- [ ] **Step 2: Update post-to-instagram.yml**

In the "Post carousels to Instagram" step, pass the brand in both branches:
```yaml
          if [ -n "${{ github.event.inputs.date }}" ]; then
            node scripts/post-to-instagram.mjs --brand nappyprice --date "${{ github.event.inputs.date }}"
          else
            node scripts/post-to-instagram.mjs --brand nappyprice
          fi
```
(Existing `IG_ACCESS_TOKEN`/`IG_USER_ID` secrets continue to work via fallback.)

- [ ] **Step 3: Validate YAML parses**

Run: `node -e "const fs=require('fs');for(const f of ['daily-run','post-to-instagram']){fs.readFileSync('.github/workflows/'+f+'.yml','utf8')};console.log('read ok')"`
Expected: `read ok` (sanity that files exist/readable; CI validates schema on push).

- [ ] **Step 4: Commit each file separately**

```bash
git add .github/workflows/daily-run.yml && git commit -m "ci: run daily pipeline for nappyprice brand"
git add .github/workflows/post-to-instagram.yml && git commit -m "ci: post nappyprice brand to Instagram"
```

---

### Task 10: Update README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Document the multi-brand layout**

Add a "Brands" section to `README.md` describing `brands/<brand>/`,
`outputs/<brand>/`, the `/daily-run <brand>` default of `nappyprice`, and that
aussie-umma is a dormant archive. Update any path examples that referenced root
`config.json` / `outputs/<date>/`.

- [ ] **Step 2: Commit**

```bash
git add README.md && git commit -m "docs: document multi-brand repo layout"
```

---

### Task 11: End-to-end acceptance run

**Files:**
- Produces: `outputs/nappyprice/<today>/run-1/` (HTML + 10 PNGs + run-log.json) and an updated `brands/nappyprice/topic-memory.json`.

- [ ] **Step 1: Run the pipeline for nappyprice**

Run: `/daily-run nappyprice`
Expected: one carousel produced end to end (research → plan → copy → build → QA → assets).

- [ ] **Step 2: Verify outputs**

Run: `ls outputs/nappyprice/$(date +%F)/run-1/ && ls outputs/nappyprice/$(date +%F)/run-1/images/ | wc -l`
Expected: an HTML file, `run-log.json`, and `10` PNGs.

- [ ] **Step 3: Visually verify one card is bilingual on the new palette**

Read one PNG (e.g. `...-03.png`). Confirm: cream background, coral/teal accents,
English headline large, Korean subtitle small + muted beneath, handle `@nappyprice`
top-right, no emojis.

- [ ] **Step 4: Verify topic memory updated**

Run: `grep -c "topic" brands/nappyprice/topic-memory.json`
Expected: at least one topic entry for today.

- [ ] **Step 5: Confirm the orchestrator committed assets per project rule**

Run: `git log --oneline -15`
Expected: per-file asset commits for the new carousel (one per PNG/HTML), consistent
with the project's one-commit-per-file rule for generated assets.

---

## Self-Review

- **Spec coverage:** multi-brand dirs (T2, T3), brand selection/BRAND threading
  (T6, T7), per-brand language config (T3, T5, T7), bilingual template + palette
  (T4), copy schema + agents (T7), poster secrets/paths/fallback (T8), CI (T9),
  migration + archive tag + discard throwaway (T1, T2), README/CLAUDE (T5, T10),
  acceptance (T11). Phase-2 price sourcing intentionally excluded. All spec
  sections map to a task.
- **Placeholder scan:** `<BRAND>` and `<today>`/`<slug>`/`<smoke-test>` are
  intentional path variables, not unfilled TODOs; concrete code/content is supplied
  for every created file.
- **Type consistency:** helper names `brandEnvKey` / `resolveBrandSecrets` /
  `formatCta` match between test (T8.S1), implementation (T8.S3), and usage (T8.S5).
  CSS class names `.ko-sub.head/.body/.label` match between tokens (T4.S3), template
  note (T4.S4), and carousel-developer (T7.S3). Copy field shape `{ en, ko }` is
  consistent across copywriter (T7.S2), carousel-developer (T7.S3), qa (T7.S4), and
  poster `formatCta` (T8).
