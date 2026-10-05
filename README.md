# All Necessary Topics Related to AI Engineering

Three single-file HTML reference guides on the fundamentals every applied AI engineer needs. Each guide is **dual-voice**: a technical version (with diagrams, code, and cited primary research) and a layman's version (plain English with analogies) at the bottom of every topic.

## Guides

| Guide | Topics | File | Size |
|---|---|---|---|
| **LLM Fundamentals** | 10 | [`llm-fundamentals.html`](llm-fundamentals.html) | ~100 KB |
| **Prompt Engineering** | 8 | [`prompt-engineering.html`](prompt-engineering.html) | ~90 KB |
| **Context Engineering** | 7 | [`context-engineering.html`](context-engineering.html) | ~80 KB |

An **index page** that links all three: [`index.html`](index.html).

## How to view

Open any file directly in a modern browser — no build step, no dependencies, no internet required. Everything is inline (CSS, SVG diagrams, code samples, citations).

```bash
# Linux
xdg-open index.html

# macOS
open index.html
```

## What's in each guide

### LLM Fundamentals
How modern language models work, cost, and behave — from an engineer's lens. Covers tokens and context windows, model families and trade-offs, closed vs open-weight, sampling parameters, streaming, structured outputs, function calling, multimodal inputs, embeddings + rerankers, and reasoning models & extended thinking.

### Prompt Engineering
The eight techniques every prompt engineer reaches for — system/user/assistant message design, few-shot examples and role prompting, chain-of-thought / ReAct / reflection patterns, XML/Markdown structuring, templating and variable injection, prompt versioning (prompts as code), output parsers and graceful failure handling, and prompt injection defense.

### Context Engineering
How to fit an infinite task into a finite window — context window budgeting, conversation summarization and rolling memory, prompt caching strategies (Anthropic / OpenAI / Gemini), hierarchical memory (working / short-term / long-term / episodic), context compression and pruning (LLMLingua), tool result truncation, and the "Lost in the Middle" phenomenon with mitigation tactics.

## Source quality

All citations resolve to:
- **arXiv papers** for the foundational techniques (BPE, SentencePiece, CoT, ReAct, Reflexion, MemGPT, LLMLingua, Lost-in-the-Middle, etc.)
- **Vendor documentation** for production patterns (Anthropic prompt caching, OpenAI prompt caching, Gemini caching, OpenAI Structured Outputs, Anthropic tool use)
- **Anthropic engineering blog** for the context-engineering playbook

Each citation ID was fetched and verified against the publisher's `citation_title` metadata.

## License

[MIT](LICENSE)

## Repository structure

```
.
├── index.html                  ← landing page linking all three guides
├── llm-fundamentals.html       ← LLM Fundamentals (10 topics)
├── prompt-engineering.html     ← Prompt Engineering (8 topics)
├── context-engineering.html    ← Context Engineering (7 topics)
├── README.md                   ← this file
└── LICENSE                     ← MIT
```