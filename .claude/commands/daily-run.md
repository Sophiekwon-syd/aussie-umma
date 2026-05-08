Run the full daily carousel pipeline.

This command launches the orchestrator agent, which will:

1. Read `config.json` and `topic-memory.json`
2. Research today's trending topics using the configured SEARCH_CONTEXTS
3. Select topics not used in the last 30 days
4. For each topic: research → plan → copy → build → QA
5. Screenshot all validated carousels to PNG
6. Update `topic-memory.json` with today's topics
7. Write `outputs/YYYY-MM-DD/run-log.json`

At the end, print a summary of what was produced.

If you want to run just part of the pipeline (e.g. re-screenshot an existing HTML file), tell the orchestrator which step to start from.
