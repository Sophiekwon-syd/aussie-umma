# Carousel Automation Template

## First Step — Always

Before doing anything else, read these two files:
- `brands/<BRAND>/config.json` — brand identity, content niche, design, pipeline params
- `brands/<BRAND>/tone-guide.md` — voice, sentence style, words to use/avoid

Every agent in the pipeline receives values extracted from these files. They are the single source of truth for what this account is, who it speaks to, and how it sounds.

---

## Commands

- **`/daily-run`** — Run the full pipeline: research → plan → copy → build → QA → assets → commit

---

## Brands

This repo hosts multiple brands. Each lives in `brands/<brand>/` with its own
`config.json`, `tone-guide.md`, and `topic-memory.json`. Outputs go to
`outputs/<brand>/YYYY-MM-DD/run-N/`.

- Active brand: **aussie-umma** (Korean only). Default for `/daily-run`.
- Dormant archive: **nappyprice** (bilingual EN/KO; not scheduled).

Run a specific brand with `/daily-run <brand>` (defaults to `aussie-umma`).

---

## Pipeline Overview

The orchestrator coordinates all agents in sequence:

1. **trend-researcher** — finds trending topics in the configured niche
2. **topic-researcher** — deep-researches each topic
3. **content-planner** — assigns a flexible-count narrative structure (7–11 cards, default 9) to each topic
4. **copywriter** — writes all card copy (bilingual EN/KO when the brand's `card.bilingual` is true)
5. **carousel-developer** — builds the HTML carousel files
6. **qa-engineer** — validates each file against quality gates
7. **asset-producer** — screenshots each card to PNG

(Per-topic agents run once per carousel; `pipeline.carousels_per_run` controls how many carousels a run produces.)

---

## Directory Structure

- `brands/<brand>/config.json` — pipeline configuration (edit before first run)
- `brands/<brand>/tone-guide.md` — brand voice guide (edit before first run)
- `brands/<brand>/topic-memory.json` — auto-updated; tracks topics used in last 30 days
- `outputs/<brand>/YYYY-MM-DD/run-N/` — all generated files for a given day
  - `images/` — PNG card exports (1080x1350px)
  - `run-log.json` — high-level execution record

---

## Quality Gates

- Card count within `pipeline.card_count_range` (aim for `pipeline.default_target`)
- The narrative spine is present in order: cover → hook → … → sheet → cta
- Exactly one save-bait `sheet` card; at least one hero number on any numeric topic
- All cards 1080px x 1350px
- No emojis anywhere in generated content
- Every HTML file must pass `qa-validator` before screenshots are taken

---

## Git Rules

- One commit per file — never bundle multiple files in a single commit
- No Co-Authored-By trailers in commit messages
- Do not commit `node_modules/` or `.cache/`
