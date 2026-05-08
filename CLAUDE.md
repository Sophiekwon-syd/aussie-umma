# Carousel Automation Template

## First Step — Always

Before doing anything else, read these two files:
- `config.json` — brand identity, content niche, design settings, pipeline parameters
- `tone-guide.md` — voice, sentence style, words to use/avoid, emotional register

Every agent in the pipeline receives values extracted from these files. They are the single source of truth for what this account is, who it speaks to, and how it sounds.

---

## Commands

- **`/daily-run`** — Run the full pipeline: research → plan → copy → build → QA → assets → commit

---

## Pipeline Overview

The orchestrator coordinates all agents in sequence:

1. **trend-researcher** — finds trending topics in the configured niche
2. **topic-researcher** (x2) — deep-researches each topic
3. **content-planner** — assigns 10-card narrative structure to each topic
4. **copywriter** (x2) — writes all Korean card copy
5. **carousel-developer** (x2) — builds the HTML carousel files
6. **qa-engineer** — validates each file against quality gates
7. **asset-producer** — screenshots each card to PNG

---

## Directory Structure

- `config.json` — pipeline configuration (edit before first run)
- `tone-guide.md` — brand voice guide (edit before first run)
- `topic-memory.json` — auto-updated; tracks topics used in last 30 days
- `outputs/YYYY-MM-DD/` — all generated files for a given day
  - `images/` — PNG card exports (1080x1350px)
  - `run-log.json` — high-level execution record

---

## Quality Gates

- Exactly `pipeline.cards_per_carousel` cards per HTML file
- All cards 1080px x 1350px
- No emojis anywhere in generated content
- Every HTML file must pass `qa-validator` before screenshots are taken

---

## Git Rules

- One commit per file — never bundle multiple files in a single commit
- No Co-Authored-By trailers in commit messages
- Do not commit `node_modules/` or `.cache/`
