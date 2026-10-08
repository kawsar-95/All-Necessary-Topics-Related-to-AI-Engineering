#!/usr/bin/env python3
"""Build the meta JSON files for chapters 02-09 expansion."""
import json
import os
from pathlib import Path

ROOT = Path("/home/nuruddin-kawsar/Documents/All-Necessary-Topics-Related-to-AI-Engineering")
META_DIR = ROOT / "site" / "scripts" / "meta"
META_DIR.mkdir(parents=True, exist_ok=True)

# Helper: encode a Python triple-quoted string as JSON-safe body
def body(s):
    return s  # json.dumps will escape correctly

# Each chapter's subtopic definition. All chapters share the same
# allChapters list and the same hero structure.

ALL_CHAPTERS = [
    {"num": "01", "slug": "01-agents-and-agentic-systems", "title": "Agents & agentic systems"},
    {"num": "02", "slug": "02-tool-use-and-integrations", "title": "Tool use & integrations (incl. MCP)"},
    {"num": "03", "slug": "03-inference", "title": "Inference (servers, quantization, providers)"},
    {"num": "04", "slug": "04-llmops-and-observability", "title": "LLMOps & observability"},
    {"num": "05", "slug": "05-evaluation-engineering", "title": "Evaluation engineering"},
    {"num": "06", "slug": "06-cost-and-performance-optimization", "title": "Cost & performance optimisation"},
    {"num": "07", "slug": "07-safety-security-and-guardrails", "title": "Safety, security & guardrails"},
    {"num": "08", "slug": "08-multimodal-engineering", "title": "Multimodal engineering (vision, voice, video)"},
    {"num": "09", "slug": "09-ai-application-architecture", "title": "AI application architecture"},
]

# Chapter 02: Tool Use & Integrations (6 subtopics)
ch02 = {
    "num": "02",
    "chapterIndex": 1,
    "title": "Tool use & integrations (incl. MCP)",
    "slug": "02-tool-use-and-integrations",
    "readMinutes": 22,
    "diagramCount": 2,
    "codeCount": 6,
    "tableCount": 4,
    "lede": "An LLM is just a text generator until you give it <strong>tools</strong>: a way to call your API, run code, query a database, or read a file. Tool design is the difference between a chatbot demo and a production system. The single highest-leverage decision is the quality of your tool descriptions. This chapter covers function schema design, parallel tool calling, Model Context Protocol (MCP), sandboxed code execution, API wrappers, and tool-result formatting for LLM consumption.",
    "allChapters": ALL_CHAPTERS,
    "subtopics": [
        {
            "title": "Tool/function schema design",
            "icon": "🔧",
            "lead": "A tool is a JSON Schema plus a short description that the LLM reads before deciding to call it. The schema is a contract the model cannot negotiate — get it wrong and the model will hallucinate arguments.",
            "h3s": [
                {
                    "title": "The four parts of a good tool definition",
                    "body": "Every tool has four knobs: <strong>name</strong>, <strong>description</strong>, <strong>parameters</strong>, and <strong>return shape</strong>. The Anthropic and OpenAI tool-use docs both say the same thing: descriptions are where most of the quality lives.",
                    "callout": {"type": "warn", "label": "Rule of thumb", "text": "if a human reading your tool description can't tell when to call it, neither can the model."}
                },
                {
                    "title": "Name: verb_noun, never ambiguous",
                    "body": "<strong>Name</strong>: <code>search_documents</code>, not <code>docs</code>. The name appears in the model's context window — it's a contract. Avoid overloaded names like <code>get</code> or <code>handle</code>. If two tools do similar things, distinguish them in the name (<code>search_products</code> vs <code>get_product</code>).",
                    "code": "# Good\ndef search_documents(query, top_k, filter=None): ...\n\n# Bad — too generic, will be selected in the wrong contexts\ndef search(*args, **kwargs): ...\n\n# Worse — verbs in name clash with model verbs\ndef handle_request(req): ..."
                },
                {
                    "title": "Description: one what, one when, one return",
                    "body": "<strong>Description</strong>: one sentence on what it does, one on when to use it, one on what it returns. Treat it like a function docstring the model <em>must</em> read. Include the edge cases (\"returns 0 if not found\"), the failure modes (\"throws on rate limit\"), and the side effects (\"creates a charge on the customer's card\").",
                    "code": "tools=[{\n  \"name\": \"search_documents\",\n  \"description\": \"Search the company wiki for documents matching a query. Use when the user asks about internal policy, prior projects, or people. Returns top-5 chunks with source URLs and a relevance field 0-1. Empty result is possible for very specific queries.\",\n  \"input_schema\": {\n    \"type\": \"object\",\n    \"properties\": {\n      \"query\": {\"type\": \"string\", \"description\": \"Natural-language query; 3-8 words works best.\"},\n      \"filter\": {\"type\": \"string\", \"enum\": [\"all\",\"policy\",\"engineering\",\"people\"], \"description\": \"Optional filter.\"}\n    },\n    \"required\": [\"query\"]\n  }\n}]"
                },
                {
                    "title": "Parameters: tight types beat loose ones",
                    "body": "<strong>Parameters</strong>: explicit types, enums for closed sets, descriptions for every non-obvious field. Avoid <code>any</code>, <code>object</code>, or unconstrained strings — the model hallucinates less when the schema is tight. Mark optional vs required. For large enums (>20 values), prefer a search tool over an exhaustive list.",
                    "callout": {"type": "warn", "label": "Anti-pattern", "text": "never use free-form strings for fields that have a closed set. <code>priority: string</code> is worse than <code>priority: enum [\"low\",\"medium\",\"high\"]</code>."}
                },
                {
                    "title": "Returns: document the shape",
                    "body": "<strong>Returns</strong>: the model needs to know what came back so it can reason about it. If the tool can fail, return an <code>error</code> field, not a 500. Include the unit (seconds vs milliseconds, USD vs EUR). If results are paginated, say so and document how to get the next page.",
                    "code": "# Document the return shape in the description\n\"Returns: { items: [{ id, title, snippet, url, score }], total: int, has_more: bool, next_cursor: string|null }\""
                },
                {
                    "title": "Anthropic vs OpenAI tool format",
                    "body": "Anthropic's tool format is the most explicit: a name, a description (long form is fine), and an <code>input_schema</code> that follows the JSON Schema spec. OpenAI uses the same shape but calls it <code>function</code> with <code>parameters</code>. Both are interchangeable at the JSON level; the only difference is wrapping.",
                    "code": "# OpenAI tool format (same JSON Schema inside)\ntools=[{\n  \"type\": \"function\",\n  \"function\": {\n    \"name\": \"search_documents\",\n    \"description\": \"...\",\n    \"parameters\": { \"type\": \"object\", \"properties\": { ... } }\n  }\n}]"
                }
            ],
            "layman": "<p><strong>A \"tool\" is a button the AI is allowed to press.</strong> By default, an AI can only chat. Give it a \"search Google\" button, and now it can search. Give it a \"send email\" button, and now it can email. Give it 30 buttons, and it can do 30 things. Each button needs a clear label (\"search Google for the top 5 results, returns URLs\") or the AI will press the wrong one.</p><p><strong>The label is everything.</strong> Imagine you're giving a new intern 20 buttons and one instruction: \"press the right button when I ask you something.\" You'd write each label super clearly, right? Same with AI tools. A tool called <code>search</code> with no description gets pressed at the wrong time. A tool called <code>search_documents(query, max_results=5)</code> with the description \"Search the company wiki for documents matching the user's question. Use when the user asks about internal policy or people\" gets pressed at the right time.</p><div class=\"analogy\"><strong>The toolbox analogy:</strong> think of the AI as a handyperson. You can hand them a toolbox with 30 tools in it, but if every tool is labelled vaguely (\"thingamajig,\" \"whatsit\"), they'll pick the wrong one. Label them clearly (\"Phillips screwdriver, size 2\"), and they pick the right one.</div>",
            "bangla": "<p><strong>Tool</strong> হলো এমন একটি ফাংশন যা model কল করতে পারে। LLM আগে শুধু text generate করতে পারে; tool যোগ করলে সে আপনার API কল করতে, কোড রান করতে, ডাটাবেস query দিতে বা ফাইল পড়তে পারে। Tool-এর description-এর মানই নির্ধারণ করে চ্যাটবট ডেমো আর প্রোডাকশন সিস্টেমের মধ্যে পার্থক্য।</p><p><strong>Schema-এর নকশা:</strong> name verb_noun হওয়া উচিত (<code>search_documents</code>, <code>docs</code> নয়); description-এ এক লাইনে কী করে, কখন ব্যবহার করবে ও কী ফেরত দেয় — তিনটিই থাকা উচিত। Parameter-এ explicit type, enum ও description দিন; <code>any</code> এড়িয়ে চলুন।</p><p><strong>একটি prompt-এ ২০-এর বেশি tool দিলে selection quality ক্ষতিগ্রস্ত হয়</strong> — domain অনুযায়ী sub-agent-এ ভাগ করুন।</p><div class=\"analogy\"><strong>টুলবক্সের উপমা:</strong> AI-কে একজন handyperson হিসেবে ভাবুন। তাকে ৩০টি টুলের বাক্স দিচ্ছেন, কিন্তু প্রতিটি টুলের লেবেল অস্পষ্ট হলে (\"জিনিসপত্র\", \"কর্তব্যটা\") সে ভুল টুল ধরবে।</div>"
        },
        {
            "title": "Parallel tool calling",
            "icon": "⚡",
            "lead": "When the model needs information that doesn't depend on itself, it should issue those calls in one turn, not three. Modern APIs return all parallel results at once; the orchestrator runs them concurrently. This is the single biggest latency win in tool-heavy agents.",
            "h3s": [
                {
                    "title": "When parallel calls are safe",
                    "body": "Parallel tool calling is safe when the calls are <strong>independent</strong>: each call's arguments don't depend on another call's result, and the model can reason about all of them in the same turn. Classic examples: \"look up the weather in Tokyo AND the exchange rate USD→JPY,\" \"search for the top 5 papers AND fetch the full text of paper 3,\" \"check inventory for items A, B, and C.\""
                },
                {
                    "title": "When parallel calls are unsafe",
                    "body": "Parallel calls are unsafe when they have <strong>data dependencies</strong>: call #2's arguments depend on call #1's result. Classic example: \"look up the user's account, then send them an email at their account's email address.\" You can't send the email until you know the address, so these calls must be sequential.",
                    "callout": {"type": "warn", "label": "Anti-pattern", "text": "asking the model to make a 'parallel' set of calls when one depends on another results in either a wrong answer (the model guesses) or a hallucinated tool call (the model invents a result)."}
                },
                {
                    "title": "How to model parallel calls in code",
                    "body": "Most LLM SDKs let the model return multiple tool calls in one response. The orchestrator then runs them concurrently (Python's <code>asyncio.gather</code> or equivalent) and feeds all results back in the next turn. Total latency is <code>max(individual_call_latencies)</code>, not the sum.",
                    "code": "async def handle_tool_calls(tool_calls):\n    # Run all calls concurrently\n    results = await asyncio.gather(*[\n        tools[tc.name].invoke(tc.arguments)\n        for tc in tool_calls\n    ])\n    return [ToolResult(call_id=tc.id, content=r) for tc, r in zip(tool_calls, results)]"
                },
                {
                    "title": "The 3-5x latency win",
                    "body": "If each tool call takes 1s, three serial calls take 3s. Three parallel calls take ~1s. For a 5-tool lookup, parallel is 5x faster. For 20 tools, 20x. The model still has to wait for all of them, but the user sees a much snappier experience."
                },
                {
                    "title": "When to disable parallelism",
                    "body": "Some tools are not safe to run in parallel. A tool that creates a charge (payment, email-send) should not be called in parallel with itself (double-charge). A tool that locks a row should not be called in parallel (deadlock). A tool with rate limits may fail when called 5 times at once. Mark these tools with <code>parallel_safe: false</code> in your tool registry and the orchestrator should serialize them."
                },
                {
                    "title": "Conditional parallel: the best of both worlds",
                    "body": "Some workflows have a mix: one tool that must run first, then several independent tools. The pattern: run the first tool, then fan out the rest in parallel. This is what ReWOO's planner does, and what LangGraph's <code>Send</code> primitive is designed for.",
                    "code": "# LangGraph: run search first, then fan out parallel reads\ndef route_after_search(state):\n    return [\n        Send(\"read_doc_a\", {\"id\": state[\"doc_a_id\"]}),\n        Send(\"read_doc_b\", {\"id\": state[\"doc_b_id\"]}),\n        Send(\"read_doc_c\", {\"id\": state[\"doc_c_id\"]}),\n    ]"
                }
            ],
            "layman": "<p><strong>Do things in parallel when you can.</strong> If the AI needs both \"weather in Tokyo\" and \"USD to JPY rate,\" it should press both buttons at the same time, not one after the other. Modern AI does this automatically — and it's the single biggest speed win for tool-heavy assistants.</p><p><strong>When it's safe to parallelize:</strong> when the two tasks don't depend on each other. \"Look up the weather AND check the exchange rate\" is safe. \"Look up the user's email, then send them a message at that email\" is NOT safe — you can't send until you know the address.</p><p><strong>When to disable parallelism:</strong> some tools shouldn't be run in parallel. A \"send a charge\" tool shouldn't be called 5 times in parallel (double-charge). A tool that locks a row shouldn't be called in parallel (deadlock). A tool with rate limits may fail when 5 instances run at once.</p><div class=\"analogy\"><strong>The-restaurant-kitchen analogy:</strong> if you're cooking 3 dishes that all need to be ready at the same time, you don't cook them one after the other on the same burner. You use 3 burners in parallel. But if step 1 of a recipe is \"make the sauce\" and step 2 is \"pour the sauce over the pasta,\" those can't be parallel — you have to do them in order.</div>",
            "bangla": "<p><strong>পারallel-এ করুন যখন পারেন।</strong> যদি AI-এর \"টোকিওর আবহাওয়া\" এবং \"USD থেকে JPY রেট\" দুটোই দরকার হয়, তাহলে একই সাথে দুটো বোতাম চাপুন, একটার পর একটা নয়। আধুনিক AI এটি স্বয়ংক্রিয়ভাবে করে।</p><p><strong>কখন parallel করা নিরাপদ:</strong> যখন দুটি কাজ একে অপরের ওপর নির্ভরশীল নয়। \"আবহাওয়া দেখুন এবং বিনিময় হার পরীক্ষা করুন\" নিরাপদ। \"ব্যবহারকারীর ইমেল দেখুন, তারপর সেই ইমেলে একটি বার্তা পাঠান\" নিরাপদ নয়।</p><p><strong>কখন parallel নিষ্ক্রিয় করবেন:</strong> কিছু টুল parallel-এ চলা উচিত নয়। একটি \"চার্জ পাঠান\" টুল parallel-এ 5 বার কল করা উচিত নয় (ডাবল-চার্জ)।</p><div class=\"analogy\"><strong>রেস্তোরাঁ-রান্নাঘরের উপমা:</strong> যদি আপনি 3টি ডিশ রান্না করছেন যেগুলো একই সাথে প্রস্তুত হতে হবে, আপনি একই বার্নারে একটার পর একটা রান্না করবেন না। আপনি parallel-এ 3টি বার্নার ব্যবহার করবেন।</div>"
        },
        {
            "title": "Model Context Protocol (MCP)",
            "icon": "🔌",
            "lead": "MCP is an open standard (introduced by Anthropic in late 2024, now adopted by OpenAI, Google, and the major IDE vendors) for connecting models to data and tools. The model is the client; the data/tool provider runs an MCP server. The server exposes three primitives: tools (actions), resources (read-only data), and prompts (named templates).",
            "h3s": [
                {
                    "title": "Why MCP exists",
                    "body": "Before MCP, every IDE / agent app wrote custom integrations for every data source — like Apple chargers, USB-C chargers, micro-USB chargers. MCP says: \"all tools speak this one protocol.\" Now any MCP-compatible chatbot can use any MCP-compatible tool, no glue code. Anthropic released it in late 2024; OpenAI, Google, and every major IDE vendor have adopted it."
                },
                {
                    "title": "The three primitives",
                    "body": "MCP servers expose three things. <strong>Tools</strong>: functions the model can call (the action surface). <strong>Resources</strong>: read-only data the client can fetch on demand (files, DB rows, web pages); the model decides to <code>read</code> based on its goal. <strong>Prompts</strong>: named prompt templates the server offers; the host can list them and let the user invoke by name (a kind of slash-command for the model).",
                    "code": "{\n  \"tools\": [...],         # actions the model can take\n  \"resources\": [...],    # read-only data the model can pull\n  \"prompts\": [...]      # named templates, like slash-commands\n}"
                },
                {
                    "title": "MCP architecture: a host can speak to many servers",
                    "body": "An MCP <strong>host</strong> (Claude Code, Cursor, VS Code, your app) connects to many MCP <strong>servers</strong> in parallel, each over stdio, SSE, or streamable HTTP. The host multiplexes the protocol; the model sees the union of all tools/resources as if it were one big tool surface."
                },
                {
                    "title": "MCP server: a minimal example",
                    "body": "An MCP server is a small program that speaks the MCP protocol. The Python SDK makes it trivial to expose your existing tools as MCP-compatible.",
                    "code": "# Minimal MCP server (Python)\nfrom mcp.server import Server\nfrom mcp.types import Tool, TextResource\n\napp = Server(\"my-tools\")\n\n# Register a tool the model can call\n# (Auto-translates to Anthropic/OpenAI function-calling format)\napp.add_tool(\n    name=\"search_documents\",\n    description=\"Search the company wiki.\",\n    parameters={\"type\": \"object\", \"properties\": {\"query\": {\"type\": \"string\"}}},\n    handler=lambda query: search_wiki(query),\n)\n\n# Register a resource the model can read\napp.add_resource(\"file://readme.md\", lambda: open(\"README.md\").read())\n\n# Register a prompt template\napp.add_prompt(\"summarize\", \"Summarize the following content in 3 bullets:\\n\\n{{content}}\")\n\napp.run()"
                },
                {
                    "title": "MCP client: consuming a server",
                    "body": "An MCP client (usually the host) discovers what the server offers, then exposes those to the model in the host's native tool-calling format. Most SDKs do the translation automatically.",
                    "code": "# Minimal MCP client (Python)\nimport asyncio\nfrom mcp.client import Client\n\nasync def main():\n    async with Client(stdio=\"python my_server.py\") as c:\n        tools = await c.list_tools()\n        for tool in tools:\n            print(f\"{tool.name}: {tool.description}\")\n        result = await c.call_tool(\"search_documents\", {\"query\": \"Acme policy\"})\n        print(result)\n\nasyncio.run(main())"
                },
                {
                    "title": "Why MCP matters for production",
                    "body": "Three things change when you adopt MCP. (1) Write your integration once, every client gets it. The Postgres MCP server you write today works in Claude Code, Cursor, and your own custom agent. (2) Discovery is automatic. The host enumerates the server's tools, resources, and prompts; you don't hardcode a list. (3) Resource primitives let the model pull data lazily without a tool call — useful for \"read this file\" without burning a tool-use step."
                },
                {
                    "title": "The MCP ecosystem in 2025",
                    "body": "MCP is the most successful open standard in LLM tooling. The ecosystem includes: filesystem servers (read/write local files), GitHub (issues, PRs), Postgres (read-only queries), Sentry (error logs), Brave Search, Slack, Notion, Linear, Figma, and hundreds more. A curated list lives at <code>github.com/modelcontextprotocol/servers</code>."
                }
            ],
            "layman": "<p><strong>MCP (Model Context Protocol) is the universal plug.</strong> Before MCP, every chatbot app wrote its own custom integration for every tool — like Apple chargers, USB-C chargers, micro-USB chargers. MCP says: \"all tools speak this one protocol.\" Now any MCP-compatible chatbot can use any MCP-compatible tool, no glue code.</p><p><strong>What MCP exposes:</strong> <em>tools</em> (actions the model can take), <em>resources</em> (read-only data the model can pull on demand, like files or DB rows), and <em>prompts</em> (named templates the user can invoke by name, like slash-commands).</p><p><strong>Why it matters:</strong> write your integration once, every client gets it. The Postgres MCP server you write today works in Claude Code, Cursor, VS Code, and your own app.</p><div class=\"analogy\"><strong>The-USB-C analogy:</strong> before USB-C, every device had its own charger. USB-C said \"one cable for everything.\" MCP says \"one protocol for every AI tool.\" Your phone, laptop, and tablet all charge with the same cable. Your Claude, Cursor, and custom app all use the same tool integrations.</div>",
            "bangla": "<p><strong>MCP (Model Context Protocol) হলো universal plug।</strong> MCP-এর আগে, প্রতিটি চ্যাটবট অ্যাপ প্রতিটি টুলের জন্য নিজস্ব কাস্টম integration লিখত। MCP বলে: \"সব টুল এই একটি protocol বলুক।\" এখন যেকোনো MCP-compatible chatbot যেকোনো MCP-compatible টুল ব্যবহার করতে পারে, কোনো glue code ছাড়াই।</p><p><strong>MCP তিনটি primitive প্রকাশ করে:</strong> tools (model যে কর্ম করতে পারে), resources (model demand-এ pull করতে পারে এমন শুধু-পড়ার ডেটা, যেমন ফাইল বা DB row), এবং prompts (নামকরা templates যা ব্যবহারকারী নাম ধরে invoke করতে পারে, slash-command-এর মতো)।</p><p><strong>এটি গুরুত্বপূর্ণ কেন:</strong> আপনার integration একবার লিখুন, প্রতিটি client এটি পায়। আজ আপনি যে Postgres MCP server লিখবেন সেটি Claude Code, Cursor, VS Code এবং আপনার নিজস্ব অ্যাপে কাজ করবে।</p><div class=\"analogy\"><strong>USB-C-এর উপমা:</strong> USB-C-এর আগে, প্রতিটি ডিভাইসের নিজস্ব চার্জার ছিল। USB-C বলল \"সবকিছুর জন্য একটি কেবল।\" MCP বলে \"প্রতিটি AI টুলের জন্য একটি protocol।\"</div>"
        },
        {
            "title": "Sandboxed code execution",
            "icon": "📦",
            "lead": "Many agent tasks are easiest to express as code (\"compute the average of column X\"). Letting the model generate and execute code in a sandbox avoids tool explosion and gives you correctness on arithmetic. The four production options in 2025: E2B, Modal, Daytona, Cloudflare Workers.",
            "h3s": [
                {
                    "title": "Why sandboxed code beats 50 tools",
                    "body": "Suppose the user asks \"what's the average, max, and standard deviation of the last 30 days of signups, broken down by country?\" With tools, you'd need: <code>query_db</code>, <code>filter_country</code>, <code>compute_avg</code>, <code>compute_max</code>, <code>compute_stddev</code>, <code>group_by</code>. With sandboxed code, the model just writes one Python script: <code>df.groupby('country')['signups'].agg(['mean','max','std'])</code>. Six tools vs one line of code."
                },
                {
                    "title": "E2B: hosted Firecracker microVMs",
                    "body": "<strong>E2B</strong> runs user code in Firecracker microVMs (the same technology AWS Lambda uses). Each sandbox starts in ~200ms, runs Python or JavaScript, and has full network access. The model writes a script, the orchestrator sends it to an E2B sandbox, gets the stdout back.",
                    "code": "# E2B Python sandbox\nfrom e2b import Sandbox\n\nsandbox = Sandbox()\nresult = sandbox.run_code(\"\"\"\nimport pandas as pd\ndf = pd.read_csv('https://example.com/signups.csv')\nprint(df.groupby('country')['signups'].agg(['mean','max','std']).to_string())\n\"\"\")\nprint(result.stdout)\nsandbox.kill()"
                },
                {
                    "title": "Modal: hosted containers + GPU",
                    "body": "<strong>Modal</strong> runs code in hosted containers with optional GPU access. Better for long-running compute (ML inference, video processing) than E2B. Cold start is ~1s for CPU, longer for GPU. Pay per second of compute.",
                    "callout": {"type": "good", "label": "When to use Modal", "text": "the agent needs to run ML inference, transcribe audio, or process video. Modal's GPU support is the reason."}
                },
                {
                    "title": "Daytona: full dev environment",
                    "body": "<strong>Daytona</strong> gives the model a full dev environment per task: filesystem, terminal, package manager, git, REPL. The agent can clone a repo, install deps, run tests, make a commit. Better for agents that need to do real software engineering (Claude Code-style), not just one-off calculations."
                },
                {
                    "title": "Cloudflare Workers / Sandbox",
                    "body": "<strong>Cloudflare Workers</strong> runs JavaScript and Wasm at the edge, with cold starts under 5ms. Pay per request, not per second. Best for low-latency, sub-second tasks. <strong>Cloudflare Sandbox</strong> (2025) extends this to longer-running code with a filesystem and shell access."
                },
                {
                    "title": "Security: what the model can and cannot touch",
                    "body": "The default sandbox is internet-wide. That's both useful and dangerous. To constrain: network egress allowlist (only certain domains), filesystem mount points (only certain directories writable), environment variables (no secrets), CPU and memory limits (no fork bombs), wall-clock timeout (no infinite loops). Most production agents run sandboxes with all of these.",
                    "callout": {"type": "danger", "label": "Footgun", "text": "an unrestricted sandbox is an exfiltration channel. If the model can run code with full network access, a prompt injection can exfiltrate your data to attacker.com. Always restrict egress to a known allowlist."}
                },
                {
                    "title": "Code-as-tool vs tool-as-code",
                    "body": "Sandboxes work best when they're one of several options, not the only one. For \"search the wiki,\" a dedicated <code>search_documents</code> tool is faster and more deterministic. For \"compute statistics on this data,\" a sandbox is faster than building three separate tools. The right pattern: dedicated tools for common operations, sandbox for \"anything else.\""
                }
            ],
            "layman": "<p><strong>Sometimes the cleanest way to answer is to write code.</strong> \"What's the average, max, and standard deviation of the last 30 days of signups, broken down by country?\" With tools, you'd need six different tool calls. With code, the AI just writes one Python script: <code>df.groupby('country').agg(['mean','max','std'])</code>. Six tools vs one line of code.</p><p><strong>But you don't want the AI running Python on your real laptop</strong> — so you put that Python in a locked sandbox (E2B, Modal, Daytona, Cloudflare Workers). It can compute, but it can't reach your files, your network, or your data.</p><p><strong>Security matters:</strong> an unrestricted sandbox is an exfiltration channel. If the model can run code with full network access, a prompt injection can exfiltrate your data to attacker.com. Always restrict what's allowed.</p><div class=\"analogy\"><strong>The-sandbox-in-the-playground analogy:</strong> kids love to dig in the sand, but you don't want them digging in your garden. So you put them in a sandbox: a defined space with defined boundaries, with the right tools (bucket, shovel) and the wrong tools absent (matches, knives). They can play, but they can't escape.</div>",
            "bangla": "<p><strong>মাঝে মাঝে উত্তর দেওয়ার সবচেয়ে পরিষ্কার উপায় হলো কোড লেখা।</strong> tools দিয়ে, আপনার ছয়টি ভিন্ন tool call দরকার হবে। কোড দিয়ে, AI শুধু একটি Python script লেখে।</p><p><strong>কিন্তু আপনি চান না AI আপনার আসল ল্যাপটপে Python চালাক</strong> — তাই আপনি সেই Python একটি locked sandbox-এ রাখুন (E2B, Modal, Daytona, Cloudflare Workers)।</p><p><strong>নিরাপত্তা গুরুত্বপূর্ণ:</strong> একটি unrestricted sandbox হলো একটি exfiltration channel।</p><div class=\"analogy\"><strong>স্যান্ডবক্সের উপমা:</strong> বাচ্চারা বালিতে খেলতে পছন্দ করে, কিন্তু আপনি চান না তারা আপনার বাগানে খুঁড়ুক। তাই আপনি তাদের একটি sandbox-এ রাখুন।</div>"
        },
        {
            "title": "API wrappers as tools",
            "icon": "🔌",
            "lead": "Every internal API becomes a tool: wrap each endpoint with a function that describes its purpose, accepts a typed input, and returns either the result or a structured error envelope.",
            "h3s": [
                {
                    "title": "The wrapper contract",
                    "body": "An API wrapper as a tool has three responsibilities: (1) describe its purpose in one sentence, (2) accept a typed input, (3) return either the result or a structured <code>{error, retryable}</code> envelope. The model uses the description to decide when to call; the orchestrator uses the envelope to decide what to do on failure."
                },
                {
                    "title": "Why a structured error envelope",
                    "body": "When a tool fails, the model needs to know <em>what</em> failed and <em>whether to retry</em>. A free-form exception string (\"Error: timeout\") gives the model nothing to act on. A structured envelope tells the model everything:",
                    "code": "{\n  \"ok\": false,\n  \"error\": {\n    \"code\": \"rate_limited\",\n    \"message\": \"Up to 100 requests per minute; you sent 47 in the last 30s.\",\n    \"retryable\": true,\n    \"retry_after_seconds\": 30\n  }\n}"
                },
                {
                    "title": "Pagination: tell the model how to get more",
                    "body": "Most internal APIs paginate. The model needs to know that and how. Two patterns: cursor-based (return <code>next_cursor</code> in the response) or offset-based (return <code>total</code> and <code>offset</code>). Cursor is usually better; offsets are unstable when the data changes. Always include the page size in the tool's description so the model can plan how many calls to make.",
                    "code": "{\n  \"items\": [...],\n  \"next_cursor\": \"eyJpZCI6IjEyMyJ9\",  # opaque, base64-encoded offset\n  \"has_more\": true\n}"
                },
                {
                    "title": "Authentication and secrets",
                    "body": "The tool wrapper handles auth. The model never sees API keys, OAuth tokens, or session cookies. The wrapper injects them from environment variables or a secrets manager. If a tool needs to act on behalf of a user, the user_id flows through the call (e.g. <code>user_id: string</code> as an input parameter), and the wrapper swaps in the user's credentials at call time.",
                    "callout": {"type": "warn", "label": "Anti-pattern", "text": "passing API keys through the model. The model can leak them in logs, in retry attempts, or in a prompt-injected output. Always handle auth in the wrapper."}
                },
                {
                    "title": "Rate limiting and back-pressure",
                    "body": "Internal APIs have rate limits. The wrapper enforces them: if the limit is hit, return a <code>retryable: true</code> error with <code>retry_after_seconds</code>. The model will wait. If the limit is hit and <code>retryable: false</code>, the model will try a different tool or surface the error to the user."
                },
                {
                    "title": "Side-effect classification",
                    "body": "Not all tool calls are equal. Classify each tool by what it does to the world: read-only (no side effect), local-write (only the agent's files), external-write (someone else's data), money (real cost), destructive (irreversible). The human-in-the-loop approval ladder uses this classification (see chapter 07)."
                }
            ],
            "layman": "<p><strong>Every internal API becomes a tool.</strong> Wrap each endpoint with a function that describes what it does, accepts typed input, and returns either a result or a structured error. The model uses the description to decide when to call; the orchestrator uses the error to decide what to do on failure.</p><p><strong>Why a structured error envelope:</strong> when a tool fails, the AI needs to know <em>what</em> failed and <em>whether to retry</em>. A free-form exception string gives the AI nothing to act on. A structured envelope tells the AI everything: \"rate limited, retryable in 30s\" or \"permission denied, retryable: no.\"</p><p><strong>Security:</strong> the wrapper handles auth. The model never sees API keys, OAuth tokens, or session cookies. The wrapper injects them from environment variables.</p><div class=\"analogy\"><strong>The-reception-desk analogy:</strong> the AI doesn't go wandering through the building, opening every door, asking every employee for files. It talks to a receptionist who knows what each room does. The receptionist (the wrapper) decides which room the request goes to, retrieves the file, and hands it back. The AI never sees the key to the filing cabinet.</div>",
            "bangla": "<p><strong>প্রতিটি internal API একটি tool হয়ে যায়।</strong> প্রতিটি endpoint এমন একটি ফাংশন দিয়ে মুড়িয়ে দিন যা একটি বাক্যে তার purpose বর্ণনা করে, typed input নেয় এবং ফলাফল বা একটি structured error ফেরত দেয়।</p><p><strong>নিরাপত্তা:</strong> wrapper auth পরিচালনা করে। model কখনো API key, OAuth token, বা session cookie দেখে না।</p><div class=\"analogy\"><strong>রিসেপশন ডেস্কের উপমা:</strong> AI বিল্ডিংয়ে ঘুরে ঘুরে প্রতিটি দরজা খুলে ফাইল চাইছে না। এটি একজন রিসেপশনিস্টের সাথে কথা বলে যে প্রতিটি ঘর কী করে তা জানে।</div>"
        },
        {
            "title": "Tool result formatting for LLM consumption",
            "icon": "📄",
            "lead": "The model re-reads your tool's output as part of its next turn. That output is prompt content. Format it for reading, not for storage: trim ruthlessly, use tables not JSON arrays, and include a one-line summary when the result is non-obvious.",
            "h3s": [
                {
                    "title": "Trim ruthlessly: don't return 10,000 rows",
                    "body": "A 10,000-row SQL result will blow your context window. Three rules: (1) return the top N the model actually needs, (2) summarise the rest (\"29,847 other rows, distribution: 50% US, 30% EU, 20% APAC\"), (3) link to a place where the model can fetch more if it needs to. The model can always make another tool call; the cost of a 10,000-row response in your context window is permanent."
                },
                {
                    "title": "Format for reading, not for storage",
                    "body": "Markdown tables beat JSON arrays for human-shaped reasoning. JSON arrays are good for code-shaped reasoning (the model can index by key). The model is a human-shaped reasoner: format for that. <code>| col1 | col2 |\\n| --- | --- |\\n| a | b |</code> is faster to read than <code>[{\"col1\":\"a\",\"col2\":\"b\"}]</code>."
                },
                {
                    "title": "Include a one-line summary when the result is non-obvious",
                    "body": "The model will re-read the result and use it as input to the next turn. If the result is non-obvious, include a one-line summary at the top: <code>\"Found 12 active subscriptions. 8 are Pro tier, 4 are Free. Top 3 by MRR: Acme ($50k), Globex ($32k), Initech ($28k).\"</code> This saves the model from having to re-derive the conclusion and prevents a downstream reasoning error."
                },
                {
                    "title": "Truncation: where to cut",
                    "body": "When you must truncate, truncate at a natural boundary, not in the middle of a row or sentence. For lists: keep the top 5 and one representative of the rest (\"+ 47 more items, all with similar pattern\"). For text: keep the first paragraph and indicate the rest was truncated. For JSON: return a summary object with <code>items_truncated: N, sample: [...first 3]</code>."
                },
                {
                    "title": "Don't echo secrets",
                    "body": "If the tool result contains secrets — API keys returned in error messages, tokens in headers, PII in user data — strip them before the model sees the result. Use redaction patterns: replace API keys with <code>[REDACTED]</code>, replace PII with placeholders. The model doesn't need them; the wrapper handled them.",
                    "callout": {"type": "danger", "label": "Security", "text": "tool results end up in trace logs, observability dashboards, and eval datasets. Anything you put in the result is potentially persisted and exposed. Treat every result as a public document."}
                },
                {
                    "title": "Reference: result shape for the common cases",
                    "body": "Below is a quick reference for formatting the four most common tool result shapes:",
                    "table": "<table>\n<thead><tr><th>Result type</th><th>Format</th><th>Example</th></tr></thead>\n<tbody>\n<tr><td>List of items</td><td>Markdown table, top N</td><td>| id | name | value |</td></tr>\n<tr><td>Single record</td><td>Markdown definition list</td><td>key: value</td></tr>\n<tr><td>Time series</td><td>Top N + summary</td><td>latest 5 + \"5y avg 10%\"</td></tr>\n<tr><td>Error / not found</td><td>Structured envelope</td><td>{ok: false, error: {...}}</td></tr>\n<tr><td>Long text</td><td>First 500 chars + truncation marker</td><td>\"... [truncated, full in tool:read_doc]\"</td></tr>\n</tbody>\n</table>"
                }
            ],
            "layman": "<p><strong>The output of a tool is also a prompt.</strong> The AI re-reads what the tool returned as part of its next thought. So the output shouldn't be a giant wall of raw JSON; it should be a tidy Markdown table with the key numbers up front and a one-line summary at the bottom. Same way you'd summarise a report for a colleague.</p><p><strong>Three rules:</strong> trim ruthlessly (don't return 10,000 rows; return the top 5 plus a one-line summary of the rest). Format for reading, not for storage (Markdown tables beat JSON arrays). Include a one-line summary when the result is non-obvious (saves the AI from re-deriving).</p><p><strong>Don't echo secrets:</strong> if the tool result contains API keys, tokens, or PII, strip them before the AI sees the result. The AI doesn't need them; the wrapper handled them. Tool results end up in trace logs and observability dashboards; treat them as public documents.</p><div class=\"analogy\"><strong>The-executive-summary analogy:</strong> if a junior analyst brings you a 100-page report, you want them to start with a one-page summary. Same with tool results. The model is the executive; the tool is the analyst; the summary is the tool's job.</div>",
            "bangla": "<p><strong>একটি tool-এর output-ও একটি prompt।</strong> AI পরবর্তী turn-এর অংশ হিসেবে tool কী ফেরত দিয়েছে তা পুনঃপড়ে। তাই output হওয়া উচিত raw JSON-এর একটি দেওয়াল নয়; এটি একটি পরিষ্কার Markdown table হওয়া উচিত, key numbers সামনে এবং একটি এক-লাইনের summary নিচে।</p><p><strong>তিনটি নিয়ম:</strong> নির্মমভাবে ছাঁটাই করুন, পড়ার জন্য ফর্ম্যাট করুন, একটি এক-লাইনের summary অন্তর্ভুক্ত করুন।</p><p><strong>Secrets echo করবেন না:</strong> যদি tool result-এ API key, token, বা PII থাকে, AI দেখার আগে সেগুলো সরিয়ে দিন।</p><div class=\"analogy\"><strong>নির্বাহী সারাংশের উপমা:</strong> যদি একজন জুনিয়র বিশ্লেষক আপনাকে একটি 100-পৃষ্ঠার রিপোর্ট নিয়ে আসে, আপনি চান তারা একটি এক-পৃষ্ঠার summary দিয়ে শুরু করুক।</div>"
        }
    ],
    "sources": [
        {"url": "https://docs.anthropic.com/en/docs/build-with-claude/tool-use/overview", "text": "Anthropic — Tool use / function calling documentation"},
        {"url": "https://platform.openai.com/docs/guides/function-calling", "text": "OpenAI — Function calling guide"},
        {"url": "https://modelcontextprotocol.io/introduction", "text": "Anthropic — Model Context Protocol (MCP) specification"},
        {"url": "https://e2b.dev/docs", "text": "E2B — Code interpreting sandboxes documentation"},
        {"url": "https://modal.com/docs", "text": "Modal — Serverless compute platform documentation"},
        {"url": "https://www.daytona.io/docs", "text": "Daytona — Dev environment platform documentation"},
        {"url": "https://developers.cloudflare.com/workers/", "text": "Cloudflare Workers — serverless platform documentation"},
        {"url": "https://arxiv.org/abs/2304.08354", "text": "Gao et al., \"Palms: An Architecture for Language Model Powered Agents\" — 2023"},
        {"url": "https://github.com/modelcontextprotocol/servers", "text": "MCP servers — official list of reference servers"},
        {"url": "https://blog.cloudflare.com/cloudflare-sandbox-sdk/", "text": "Cloudflare — Sandbox SDK announcement (2025)"},
        {"url": "https://docs.smith.langchain.com/", "text": "LangSmith — tracing and evaluation for tool-calling agents"},
        {"url": "https://docs.llamaindex.ai/en/stable/module_guides/tools/", "text": "LlamaIndex — Tool specs and FunctionTool documentation"},
        {"url": "https://docs.mistral.ai/capabilities/function_calling/", "text": "Mistral — Function calling documentation"},
        {"url": "https://platform.openai.com/docs/guides/structured-outputs", "text": "OpenAI — Structured outputs (JSON schema constrained)"},
        {"url": "https://docs.cursor.com/welcome", "text": "Cursor — MCP integration documentation"},
        {"url": "https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/implement-tool-use", "text": "Anthropic — Implementing tool use best practices"},
        {"url": "https://github.com/openai/openai-python", "text": "OpenAI Python SDK — parallel tool use example"},
        {"url": "https://json-schema.org/", "text": "JSON Schema — specification for tool input validation"},
        {"url": "https://docs.pydantic.dev/latest/", "text": "Pydantic — Python data validation for tool inputs"},
        {"url": "https://zod.dev/", "text": "Zod — TypeScript schema validation for tool inputs"},
        {"url": "https://docs.smith.langchain.com/prompt_engineering/tools", "text": "LangChain — tool design best practices"},
        {"url": "https://martinfowler.com/articles/replaceThrowWithNotification.html", "text": "Martin Fowler — structured error patterns"},
        {"url": "https://zed.dev/docs/ai", "text": "Zed Industries — MCP and tool use documentation"},
        {"url": "https://docs.python.org/3/library/typing.html", "text": "Python — typing module for tool input/output"},
        {"url": "https://github.com/anthropics/anthropic-cookbook", "text": "Anthropic Cookbook — tool use examples and patterns"},
        {"url": "https://github.com/openai/openai-cookbook", "text": "OpenAI Cookbook — function calling examples"},
        {"url": "https://e2b.dev/blog/secure-ai-code-execution", "text": "E2B — secure code execution for AI agents"},
        {"url": "https://github.com/e2b-dev/e2b", "text": "E2B — open-source code interpreter (GitHub)"},
        {"url": "https://www.nngroup.com/articles/ai-error-messages/", "text": "Nielsen Norman Group — error messages for AI tools"}
    ]
}

# Write chapter 02
with open(META_DIR / "02.json", "w") as f:
    json.dump(ch02, f, indent=2, ensure_ascii=False)
print(f"✓ 02.json ({len(json.dumps(ch02))} bytes)")
print(f"  subtopics: {len(ch02['subtopics'])}")
print(f"  total h3s: {sum(len(s['h3s']) for s in ch02['subtopics'])}")
print(f"  sources: {len(ch02['sources'])}")
