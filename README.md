# All Necessary Topics Related to AI Engineering

Five single-file HTML reference guides on the fundamentals every applied AI engineer needs. Each guide is **multi-voice**: a technical version (with diagrams, code, and cited primary research) and a layman's version (plain English with analogies) at the bottom of every topic. Every topic also ends with a **Bangla explanation (বাংলা ব্যাখ্যা)** panel.

## Guides

| Guide | Topics | File | Size |
|---|---|---|---|
| **LLM Fundamentals** | 10 | [`llm-fundamentals.html`](llm-fundamentals.html) | ~100 KB |
| **Prompt Engineering** | 8 | [`prompt-engineering.html`](prompt-engineering.html) | ~90 KB |
| **Context Engineering** | 7 | [`context-engineering.html`](context-engineering.html) | ~80 KB |
| **RAG & Knowledge Systems** | 10 | [`rag-knowledge-systems.html`](rag-knowledge-systems.html) | ~290 KB |
| **Agents & Agentic Systems** | 9 | [`agents-agentic-systems.html`](agents-agentic-systems.html) | ~180 KB |

An **index page** that links all five: [`index.html`](index.html).

## How to view

Open any file directly in a modern browser — no build step, no dependencies, no internet required. Click (or tap) any diagram to enlarge it; press Esc to close. Everything is inline (CSS, SVG diagrams, code samples, citations).

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

### RAG & Knowledge Systems
How retrieval-augmented systems find, rank, and ground knowledge — chunking strategies (fixed, semantic, structural, late), vector databases (Qdrant, Pinecone, Weaviate, pgvector, Chroma, Milvus), hybrid search and reciprocal rank fusion, query rewriting / expansion / HyDE, multi-hop and agentic retrieval, reranking (Cohere, BGE, Voyage), metadata filtering and structured retrieval, GraphRAG, document parsing pipelines (Unstructured, LlamaParse, Docling), and multimodal RAG. Includes 30+ SVG diagrams.

### Agents & Agentic Systems
How LLM agents plan, act, remember, and recover — agent loops (ReAct, Plan-and-Execute, Reflexion, ReWOO), single- vs multi-agent orchestration, state machines and workflow graphs (LangGraph, Mastra, Inngest), agent memory (scratchpad, semantic, episodic, procedural), human-in-the-loop checkpoints and approvals, subagents and delegation, error recovery and self-correction, long-running agents with durable execution (Temporal, Restate), and browser and computer-use agents. Each section adds a **"Learn visually"** box with curated videos, docs, and demos.

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
├── index.html                  ← landing page linking all five guides
├── llm-fundamentals.html       ← LLM Fundamentals (10 topics)
├── prompt-engineering.html     ← Prompt Engineering (8 topics)
├── context-engineering.html    ← Context Engineering (7 topics)
├── rag-knowledge-systems.html  ← RAG & Knowledge Systems (10 topics)
├── agents-agentic-systems.html ← Agents & Agentic Systems (9 topics)
├── README.md                   ← this file
└── LICENSE                     ← MIT
```