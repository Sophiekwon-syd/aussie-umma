# nappyprice — Multi-Brand Carousel Monorepo (Design)

- **Date:** 2026-06-29
- **Status:** Approved (pending spec review)
- **Author:** Sophie + Claude

## Summary

Convert the single-brand `aussie-umma` carousel automation project into a
**multi-brand monorepo**. Add `nappyprice` as the active brand (saving money on
nappies, wipes, and baby essentials) with **bilingual cards** (English primary,
Korean subtitle) and a refreshed, friendlier palette. Keep `aussie-umma` in the
repo as a **dormant archive** (its Instagram account was renamed to nappyprice,
so it has no live account and is not scheduled).

The existing Instagram Graph API credentials and GitHub Actions secrets are
reused unchanged, because the Instagram account is the same account renamed.

## Goals

- Host multiple brands in one repo, each fully self-contained and selectable by a
  `BRAND` parameter.
- Ship `nappyprice` end to end: research → plan → copy → build → QA → assets →
  post, using the existing pipeline.
- Support bilingual cards (English large + Korean subtitle small/muted) driven by
  per-brand config, not hardcoded.
- Reuse existing IG secrets for nappyprice; define a forward-compatible per-brand
  secret convention.

## Non-Goals (deferred)

- **Live price/deal sourcing.** nappyprice is "mix of both" — start with evergreen
  money-saving guides; a price-fetching research step is phase 2.
- Reviving or rescheduling aussie-umma.
- Building CI for more than the single active brand (matrix-ready, not matrix-built).

## Architecture

### Directory structure

```
brands/
  nappyprice/
    config.json
    tone-guide.md
    topic-memory.json
  aussie-umma/
    config.json
    tone-guide.md
    topic-memory.json
outputs/
  nappyprice/YYYY-MM-DD/run-N/
    images/
    *.html, *.json, run-log.json
  aussie-umma/YYYY-MM-DD/run-N/     (existing dated dirs migrated here)
.claude/
  agents/        (brand-aware: resolve brands/<brand>/ paths)
  commands/daily-run.md
  rules/brand-rules.md
  skills/html-card/   (shared template.html + tokens.css, bilingual-aware)
scripts/         (brand-aware: --brand argument)
.github/workflows/
docs/superpowers/specs/
```

### Brand selection

- A `BRAND` value threads through the whole pipeline.
- `/daily-run <brand>` (default `nappyprice`) tells the orchestrator which brand
  to run. The orchestrator reads `brands/<brand>/config.json`,
  `brands/<brand>/tone-guide.md`, and `brands/<brand>/topic-memory.json`, and
  passes the resolved brand + paths to every subagent.
- Outputs are written under `outputs/<brand>/YYYY-MM-DD/run-N/`.
- aussie-umma exists as a slot but is never scheduled.

### Per-brand language config (no hardcoded bilingual)

Each brand's `config.json` declares card language behavior so shared rules and the
template stay brand-agnostic:

- nappyprice:
  ```json
  "card": { "bilingual": true, "primary": "English", "subtitle": "Korean" }
  ```
- aussie-umma:
  ```json
  "card": { "bilingual": false, "primary": "Korean" }
  ```

`brand-rules.md` replaces the current rule "Do not mix languages within a card"
with: "Follow the brand's `card` language config — when `bilingual` is true,
render the `primary` language large and the `subtitle` language small and muted
directly beneath it." All other rules (no emojis, no brand names in content, no
placeholder text, sourced statistics, exact card count and dimensions) are
unchanged and remain brand-agnostic.

## Components

### 1. Card template (`.claude/skills/html-card/`)

- **tokens.css** — refreshed friendly palette (final values confirmed at review):
  - background cream `#FFF7F0`
  - primary text `#2B2622`
  - accent primary (CTA, price callouts) coral `#FF6F5E`
  - accent secondary (savings badges/tags) teal `#1FB6A6`
  - muted (Korean subtitle, secondary text) warm grey `#9B9088`
  - New text style: subtitle = small size, muted color, tight line-height,
    sits directly under its English headline/line.
- **template.html** — supports two render modes:
  - bilingual: each text element renders English (large, primary) then a Korean
    subtitle line (small, muted) beneath it.
  - single-language: unchanged behavior (used by aussie-umma).
- Cards remain 1080×1350px; handle top-right; no footer, no page dots.

### 2. Copy schema + copywriter

- Every text field in the copy JSON becomes an object `{ "en": "...", "ko": "..." }`
  for bilingual brands. Single-language brands keep a plain string.
- The copywriter writes English-primary copy in the brand voice and a **concise,
  natural Korean subtitle** (not a literal word-for-word translation). Body copy
  follows the same EN-large / KO-small pattern as headlines.

### 3. carousel-developer

- Reads the brand's `card` config and renders bilingual or single-language
  accordingly, consuming `{ en, ko }` fields.

### 4. qa-engineer

- Existing gates unchanged (exactly N cards, 1080×1350, no emojis, passes before
  screenshots). Adds a bilingual check for bilingual brands: every text element
  has both `en` and `ko` present and rendered.

### 5. scripts/post-to-instagram.mjs

- Accepts `--brand <brand>` (default `nappyprice`).
- Reads runs from `outputs/<brand>/<date>/run-N/`.
- Builds image URLs under `.../outputs/<brand>/...` on raw.githubusercontent.
- Secrets: tries `IG_ACCESS_TOKEN_<BRAND>` / `IG_USER_ID_<BRAND>` first, then
  falls back to `IG_ACCESS_TOKEN` / `IG_USER_ID`. nappyprice uses the existing
  (fallback) secrets unchanged; adding a future brand only requires adding the
  suffixed secrets.
- `REPO` fallback string updated from `Sophiekwon-syd/aussie-umma` to the renamed
  repo (or driven entirely by `GITHUB_REPOSITORY` in CI).

### 6. CI workflows

- `daily-run.yml`: runs `/daily-run nappyprice`. Structured so additional active
  brands can later become a matrix; only nappyprice is active now.
- `post-to-instagram.yml`: passes `--brand nappyprice`.

## Content strategy (brands/nappyprice/config.json)

- **brand.name:** `NAPPYPRICE`; **account:** `@nappyprice`
- **niche:** Cutting the cost of nappies, wipes, and baby essentials for parents
  in Australia. Bilingual English/Korean.
- **target_audience:** Budget-conscious parents of babies/toddlers in Australia;
  Korean-speaking parents are a core segment (hence the Korean subtitle).
- **tone:** A savvy, friendly deal-finding friend. Practical, upbeat, concrete
  numbers. English primary voice; Korean subtitle concise and natural.
- **recurring_themes:** cost-per-use comparison; wipes value; bulk buying &
  subscribe-and-save; retailer sale cycles & stockpiling timing; reusable vs
  disposable; baby-essential starter checklists.
- **search_contexts:** AU nappy/wipes pricing trends; major-retailer baby sale
  cycles; reusable-nappy cost analysis; parenting-forum "how to save on nappies"
  threads.
- **cta_text:** `{ "en": "Save this →", "ko": "저장하기" }`
- **topics_to_avoid:** medical claims about specific products; brand bashing;
  sponsored/affiliate framing; anything requiring live prices (until phase 2).
- **design:** refreshed friendly palette (see tokens above).
- **pipeline:** `carousels_per_run: 1`, `cards_per_carousel: 10` (unchanged).

## Migration plan

1. Tag current repo state `aussie-umma-archive` (safety snapshot).
2. Discard the uncommitted 2026-06-28 aussie-umma run (throwaway after pivot).
3. Create `brands/aussie-umma/` and move root `config.json`, `tone-guide.md`,
   `topic-memory.json` into it; add `card.bilingual: false`.
4. Move existing `outputs/<date>/` dirs under `outputs/aussie-umma/`.
5. Create `brands/nappyprice/` with new `config.json`, `tone-guide.md` (English
   voice + Korean-subtitle rules), and an empty `topic-memory.json`.
6. Make pipeline brand-aware: orchestrator, all agents, `/daily-run` command,
   `brand-rules.md`, scripts, and both workflows.
7. Refresh `.claude/skills/html-card/` tokens + template for the new palette and
   bilingual rendering.
8. Update `CLAUDE.md` and `README.md` for the multi-brand structure.
9. (Operational, outside this repo) Rename the GitHub repo if desired; existing
   secrets and workflows persist across a rename.

## Git rules

- One commit per file. No `Co-Authored-By` trailers.
- `outputs/`, brand `config.json`, `tone-guide.md`, and `topic-memory.json` remain
  tracked (the Post-to-Instagram workflow fetches PNGs via raw.githubusercontent).

## Open items to confirm at spec review

- Final palette hex values.
- Whether body copy is bilingual (assumed yes) or English-only with bilingual
  headlines only.
- Repo rename on GitHub (operational, not code).
