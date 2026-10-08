# Hands-on labs, Stage 1 — design

Date: 2026-10-09
Status: design approved in chat; this spec awaits review

## Goal

Readers learn each topic by building one real app with real models. The app
is a **study assistant** for this site: it answers questions about AI
engineering and uses the site's own 13 parts as its knowledge base. The app
grows across all 13 parts. Each section of the site is one step.

Each step runs on any model, in two tracks:

- **Free track:** local open-weight models through Ollama. No account, no cost.
- **Paid track:** Claude, GPT, or Gemini through an API key.

## Stages

The work ships in 5 stages. Each stage gets its own spec, plan, and release.

| Stage | Scope |
|---|---|
| 1 (this spec) | Lab framework, model switch, site "Try it" panel, `/labs/` setup page, Part 1 (10 steps) |
| 2 | Parts 2–3 (prompting, context) |
| 3 | Part 4 (RAG over the 13 parts, English and Bangla) |
| 4 | Part 5 (the assistant becomes an agent) |
| 5 | Parts 6–13 |

Out of scope for Stage 1: Parts 2–13, a web UI for the assistant, a hosted
backend, and running labs in the browser.

## Decisions

| Topic | Decision |
|---|---|
| Language | Python 3.12, managed with `uv` |
| Multi-provider client | LiteLLM, through one wrapper module |
| Provider-only features | The step calls that provider's official SDK directly and says so (Claude: `anthropic` Python SDK) |
| Knowledge base | The site's own `src/content/*.json` |
| Interface | Terminal only (one script per step) |
| Lab location | `labs/` at the repo root |

## Lab project

### Layout

```
labs/
  pyproject.toml          uv project: dependencies, pytest config
  .env.example            two ready blocks: free track and paid track
  README.md               setup, how to run a step, track switching
  study/                  the growing app (shared package)
    config.py             reads .env: MODEL, EMBED_MODEL, VISION_MODEL, REASONING_MODEL
    content.py            loads src/content/*.json; plain text per part and section
    llm.py                the one LiteLLM wrapper: chat, stream, embed
    quiz.py               Pydantic quiz schema
    tools.py              get_section tool: schema + implementation
    search.py             cosine similarity, top-k sections
    diagrams.py           render a section diagram (SVG) to PNG
  part01/                 one runnable script per step
    s01_tokens.py … s10_reasoning.py
  tests/                  offline pytest tests; smoke tests marked `model`
```

A reader runs one step with `uv run python -m part01.s01_tokens` from
`labs/`. Each script:

1. Starts with a comment block: the goal, the site section it belongs to,
   and what to look for in the output.
2. Prints a short labelled result.
3. Exits with a clear message if a needed model or key is missing.

### Model switch

`labs/.env` sets four variables. `.env.example` has both tracks ready:

| Variable | Free track (Ollama) | Paid track (Claude example) |
|---|---|---|
| `MODEL` | `ollama_chat/qwen3:4b` | `anthropic/claude-opus-5-5` |
| `EMBED_MODEL` | `ollama/nomic-embed-text` | an OpenAI or Gemini embedding model (Anthropic has no embedding endpoint) |
| `VISION_MODEL` | `ollama_chat/qwen2.5vl:3b` | `anthropic/claude-opus-5-5` |
| `REASONING_MODEL` | `ollama_chat/qwen3:4b` (thinking on) | `anthropic/claude-opus-5-5` (effort `high`) |

`.env.example` also lists OpenAI and Gemini lines. The current OpenAI and
Gemini model names are looked up in the provider docs during implementation
and written there; they are not guessed.

Rules:

- `study/llm.py` is the only module that calls LiteLLM.
- A step that compares models (step 2) also uses `COMPARE_MODELS`, a
  comma-separated list. The Claude example list is `anthropic/claude-opus-5-5`
  and `anthropic/claude-haiku-5-5`.
- API keys come from the usual environment variables (`ANTHROPIC_API_KEY`,
  `OPENAI_API_KEY`, `GEMINI_API_KEY`). The labs never print a key.

### Part 1 steps

| Step | Site section | What the reader builds and sees |
|---|---|---|
| 1.1 `s01_tokens` | Tokens, tokenization & context cost | Load one part's text. Count its tokens with three tokenizers: OpenAI's (`tiktoken`), the local model's (Ollama's `prompt_eval_count`), and Claude's (`messages.count_tokens` in the `anthropic` SDK, paid track only). Estimate the input cost of sending the whole part in one prompt, from LiteLLM's model price table. |
| 1.2 `s02_compare` | Model families & trade-offs | Ask every model in `COMPARE_MODELS` the same study question. Print a table: answer start, latency, input/output tokens, cost. |
| 1.3 `s03_open_vs_closed` | Closed vs open-weight | Ask the same question to the local model and to an API model. Print where the data went (machine vs provider), cost, and the two answers side by side. |
| 1.4 `s04_sampling` | Sampling parameters | Generate one quiz question 3 times at temperature 0 and 3 times at temperature 1, and show repeatability against variety. The script explains that current Claude models reject `temperature`, `top_p`, and `top_k` (the API returns 400), so this step runs on the local model or on an OpenAI or Gemini model; with a Claude `MODEL` it prints that explanation and exits. |
| 1.5 `s05_streaming` | Streaming vs non-streaming | Stream an answer to the terminal. Measure time to first token and total time, and compare them with a non-streamed call. |
| 1.6 `s06_structured` | Structured outputs & JSON mode | Generate a 3-question quiz on a section as JSON, validate it with the Pydantic schema in `study/quiz.py`, and retry once on a validation error. |
| 1.7 `s07_tools` | Function calling & tool use | Give the model the `get_section(part, section)` tool from `study/tools.py`. Ask a question; the model calls the tool; the script runs it and returns the section text; the model answers from the real content. Print each tool call. |
| 1.8 `s08_multimodal` | Multimodal inputs | Render a diagram from Part 1 to PNG with `study/diagrams.py`, send it to `VISION_MODEL`, and print its explanation next to the diagram's caption from the site. |
| 1.9 `s09_embeddings` | Embedding models & rerankers | Embed every section of all 13 parts (title, sub, and Technical text, cut to the embedding model's input limit) with `EMBED_MODEL`, cache the vectors in `labs/.cache/`, and print the 5 sections most similar to a question. Optional extra: rerank the 5 with a reranker if the reader's track has one. |
| 1.10 `s10_reasoning` | Reasoning models | Ask for a two-week study plan under constraints (hours per day, prerequisites, a deadline). Free track: `qwen3` with thinking off, then on. Claude: effort `low`, then `high` (thinking is always on for current Claude models; effort sets its depth). Print both plans, the times, and the token counts. |

### Error handling

- **Missing model or key:** the step exits with one line that says which
  variable to set or which `ollama pull` to run.
- **Ollama not running:** the step exits with the command to start it.
- **Provider error (rate limit, bad request):** print the provider's message
  and the model name, then exit with status 1. No retries hide errors, except
  the single validation retry in step 1.6.

## Site changes

### `lab` field

Each section can have an optional `lab` object, validated by the content
schema (strict, like the rest):

```ts
type Lab = {
  step: string;      // "1.1"
  title: string;     // short name of the step
  goal: string;      // one or two sentences
  command: string;   // "uv run python -m part01.s01_tokens"
  file: string;      // repo path, e.g. "labs/part01/s01_tokens.py"
  expect: string;    // what the output shows
  challenge: string; // one extension task
};
```

All text fields are plain text (no HTML). `file` must start with `labs/`.

### "Try it" panel

On a section that has `lab`, a "Try it" panel shows after the section text
and before the "Watch" videos. It shows the step number, title, goal, the
command in a copyable code line, a link to the file on GitHub
(`https://github.com/kawsar-95/All-Necessary-Topics-Related-to-AI-Engineering/blob/main/<file>`),
the expected output, and the challenge. It appears in every voice, because
the code is the same for every reader. A link "New to the labs? Start with
setup" goes to `/labs/`.

### `/labs/` page

A static page with:

1. What the study assistant is and how the stages map to the 13 parts.
2. Free track setup: install `uv` and Ollama; `ollama pull` the three models.
3. Paid track setup: set one provider's API key; copy the paid block of
   `.env.example`.
4. How to run a step and what a step prints.
5. A list of the Part 1 steps with links to their sections.

The sidebar gets a "Labs" link under the 13 parts.

## Testing

| Layer | Test |
|---|---|
| Labs, offline | pytest: content loading (13 parts, 53 sections), token counting with `tiktoken`, quiz schema accepts a valid quiz and rejects bad ones, `get_section` returns the right text and handles a bad part or section, cosine top-k on fixed vectors, SVG-to-PNG produces a PNG |
| Labs, with models | pytest marker `model`: one smoke run per step, skipped unless `LABS_SMOKE=1`; run by hand on the free track before release |
| CI | GitHub Actions runs `uv run pytest -m "not model"` in `labs/` on every push that touches `labs/` |
| Site | node tests for the `lab` schema (valid lab, bad `file` path, unknown key); build; browser check of the "Try it" panel and the `/labs/` page at 375 px and 1280 px |

## Risks

- **Local model quality:** a 4B model gives weaker answers than an API
  model. Each step says so where it matters; that difference is part of the
  lesson (step 1.3).
- **LiteLLM structured output on Ollama:** JSON-schema output through
  `ollama_chat/` is not confirmed in LiteLLM's docs. Step 1.6 validates with
  Pydantic and retries once, so it works with plain JSON mode too. The plan
  verifies the exact call on both tracks.
- **Download size:** the free track pulls about 6 GB of models. The `/labs/`
  page states this before the commands.
