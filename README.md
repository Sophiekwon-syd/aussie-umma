# Carousel Automation

Multi-agent Instagram carousel generator powered by Claude Code.

One command generates two fully-designed, research-backed 10-card carousels and exports them as PNG screenshots — ready to upload.

```
/daily-run
```

```
trend-researcher ──┬──► topic-researcher ×2 (parallel)
                   │
                   ▼
           content-planner
                   │
          ├──────► copywriter ──► carousel-developer ──┐
          │   (per topic, parallel)                    │
          └──────► copywriter ──► carousel-developer ──┤
                                                        │
                                                        ▼
                                                   qa-engineer
                                                        │
                                                        ▼
                                                 asset-producer
                                              outputs/YYYY-MM-DD/
```

---

## New to AI coding? Start here

Open `setup-guide.html` in your browser for a visual step-by-step walkthrough.

## Quick start

### Prerequisites

- [Claude Code](https://claude.ai/code) installed and authenticated
- Node.js 18+

### Setup

```bash
git clone https://github.com/Sophiekwon-syd/carousel-automation-template
cd carousel-automation-template

cp config.example.json config.json
cp tone-guide.example.md tone-guide.md
cp topic-memory.example.json topic-memory.json

npm install
```

Edit `config.json` with your brand details. Edit `tone-guide.md` to match your voice. See the [Configuration](#configuration) section below.

### Run

Open Claude Code in this directory and run:

```
/daily-run
```

Or the full form:

```
claude --agent orchestrator "Run the daily pipeline"
```

The orchestrator handles everything from there. First run takes ~5 minutes (subsequent runs are faster as the agents cache patterns). When it finishes, your carousels are in `outputs/YYYY-MM-DD/`.

---

## Configuration

All pipeline behaviour is controlled by two files:

### `config.json`

| Field                         | What it controls                                                           |
| ----------------------------- | -------------------------------------------------------------------------- |
| `brand.account`               | Your handle — shown in every card footer                                   |
| `brand.name`                  | Your brand name — shown in every card footer                               |
| `content.niche`               | What your account covers — used to find relevant topics                    |
| `content.target_audience`     | Who you're writing for — **copywriter writes in this audience's language** |
| `content.tone`                | Voice descriptor passed to the copywriter                                  |
| `content.topics_to_avoid`     | Topics the pipeline will never use                                         |
| `content.recurring_themes`    | Preferred topic categories                                                 |
| `content.search_contexts`     | Where the trend-researcher looks for signals                               |
| `content.cta_text`            | The save/bookmark button text on Card 10                                   |
| `design.accent_primary`       | Main accent colour (hex)                                                   |
| `design.accent_secondary`     | Secondary accent colour (hex)                                              |
| `pipeline.carousels_per_run`  | How many carousels to produce per run (default: 2)                         |
| `pipeline.cards_per_carousel` | Cards per carousel — designed for 10, other counts untested                |

Start from `config.example.json` — every field has a description.

### `tone-guide.md`

Free-form markdown. The copywriter reads this in full before writing. Cover:

- **Voice** — how you'd describe the personality in a sentence
- **Sentence style** — length, structure, rhetorical devices you use
- **Words to use** — openers, empathy phrases, action nudges that feel on-brand
- **Words to avoid** — hedging language, stiff formality, condescending expressions
- **Emotional register** — how the mood should shift across the 10 cards
- **Hard rules** — non-negotiables (no emojis is already in the pipeline; add yours here)

Start from `tone-guide.example.md`.

---

## How the pipeline works

### Agents

| Agent                | Role                                                         |
| -------------------- | ------------------------------------------------------------ |
| `orchestrator`       | Coordinates all agents in sequence, manages the run log      |
| `trend-researcher`   | Searches SEARCH_CONTEXTS for today's trending topics         |
| `topic-researcher`   | Deep-researches a single topic from 3–4 sources              |
| `content-planner`    | Assigns each piece of research to a 10-card narrative slot   |
| `copywriter`         | Writes all card copy in the audience's language              |
| `carousel-developer` | Builds the self-contained HTML file from copy                |
| `qa-engineer`        | Validates card count, dimensions, no emojis, no placeholders |
| `asset-producer`     | Screenshots each card to PNG using Puppeteer                 |

Agent definitions live in `.claude/agents/`. The `/daily-run` command in `.claude/commands/` launches the orchestrator.

### The 10-card narrative arc

Every carousel follows this structure:

| Card | Role          | Purpose                          |
| ---- | ------------- | -------------------------------- |
| 01   | Cover         | Stop the scroll                  |
| 02   | Hook          | "That's exactly me"              |
| 03   | Definition    | What this actually is            |
| 04   | Key Insight   | The most important data point    |
| 05   | Context       | How this plays out in daily life |
| 06   | Approaches    | Different ways to address it     |
| 07   | Small Actions | What to do today                 |
| 08   | Do / Don't    | Right vs wrong approach          |
| 09   | Steps         | How to get started               |
| 10   | CTA           | Save & share                     |

### Output structure

```
outputs/
└── 2026-05-07/
    ├── run-log.json
    ├── health-intelligence.html
    ├── health-intelligence/
    │   ├── card-01.png
    │   ├── card-02.png
    │   └── ...card-10.png
    ├── stress-management.html
    └── stress-management/
        └── ...
```

---

## Customisation

### Changing the language

Edit `content.target_audience` in `config.json`. The copywriter generates in the language of the audience. The trend-researcher adapts its searches to the same language and communities.

### Changing the design

The design system lives in `.claude/skills/html-card/tokens.css`. This documents every CSS class and token used across all card layouts.

To change the colour scheme, edit `design.accent_primary` and `design.accent_secondary` in `config.json`.

### Changing card count

Edit `pipeline.cards_per_carousel` in `config.json`. The system is designed and tested for 10 cards. Other counts will work but the narrative structure in `content-planner` assumes 10 slots.

### Adding a topic to the avoid list

Add it to `content.topics_to_avoid` in `config.json`. The trend-researcher and orchestrator both check this list.

---

## Examples

The `examples/` directory contains a real pipeline run:

- `research-example.json` — output from `topic-researcher`
- `copy-example.json` — output from `copywriter`
- `carousel-example.html` — output from `carousel-developer` (open in a browser to preview the dark/lime design)

---

## File structure

```
carousel-automation-template/
├── config.example.json         ← copy to config.json and edit
├── tone-guide.example.md       ← copy to tone-guide.md and edit
├── topic-memory.example.json   ← copy to topic-memory.json
│
├── .claude/
│   ├── agents/
│   │   ├── orchestrator.md
│   │   ├── trend-researcher.md
│   │   ├── topic-researcher.md
│   │   ├── content-planner.md
│   │   ├── copywriter.md
│   │   ├── carousel-developer.md
│   │   ├── qa-engineer.md
│   │   └── asset-producer.md
│   ├── commands/
│   │   └── daily-run.md
│   ├── skills/
│   │   └── html-card/
│   │       ├── tokens.css      ← design system reference
│   │       └── template.html   ← card structure reference
│   └── rules/
│       └── brand-rules.md
│
├── screenshot.js               ← Puppeteer card screenshotter
├── package.json
│
└── examples/
    ├── research-example.json
    ├── copy-example.json
    └── carousel-example.html
```

Files gitignored (contain your personal brand data):

- `config.json`
- `tone-guide.md`
- `topic-memory.json`
- `outputs/`
- `node_modules/`

---

## License

MIT
