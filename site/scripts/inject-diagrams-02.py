#!/usr/bin/env python3
"""Inject 2 SVG diagrams into chapter 02 meta JSON."""
import json
from pathlib import Path

META = Path("/home/nuruddin-kawsar/Documents/All-Necessary-Topics-Related-to-AI-Engineering/site/scripts/meta/02.json")

with open(META) as f:
    data = json.load(f)

# Diagram 1: MCP architecture
mcp_diagram = '''<svg viewBox="0 0 1100 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="MCP architecture: host connects to many servers">
  <defs>
    <marker id="arr-mcp" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
      <path d="M0,0 L6,4 L0,8 Z" fill="#94a3b8"/>
    </marker>
  </defs>
  <rect x="40" y="100" width="180" height="120" rx="10" fill="#0f172a" stroke="#22d3ee"/>
  <text x="130" y="130" text-anchor="middle" font-family="Inter, sans-serif" font-size="14" font-weight="700" fill="#22d3ee">MCP Host</text>
  <text x="130" y="150" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#a8b5c8">(Claude Code, Cursor,</text>
  <text x="130" y="164" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#a8b5c8">VS Code, your app)</text>
  <text x="130" y="190" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#94a3b8">connects to many servers</text>
  <rect x="270" y="120" width="120" height="80" rx="10" fill="#0f172a" stroke="#a78bfa"/>
  <text x="330" y="150" text-anchor="middle" font-family="Inter, sans-serif" font-size="12" font-weight="700" fill="#a78bfa">MCP Client</text>
  <text x="330" y="170" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#cfd8e6">JSON-RPC</text>
  <rect x="450" y="40" width="220" height="70" rx="10" fill="#0f172a" stroke="#34d399"/>
  <text x="560" y="40" text-anchor="middle" font-family="Inter, sans-serif" font-size="12" font-weight="700" fill="#34d399" dy="20">Filesystem server</text>
  <text x="560" y="70" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#cfd8e6">tools: read_file, write_file</text>
  <text x="560" y="84" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#cfd8e6">resources: file://...</text>
  <text x="560" y="98" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#94a3b8">stdio / sse / http</text>
  <rect x="700" y="40" width="220" height="70" rx="10" fill="#0f172a" stroke="#fbbf24"/>
  <text x="810" y="40" text-anchor="middle" font-family="Inter, sans-serif" font-size="12" font-weight="700" fill="#fbbf24" dy="20">GitHub server</text>
  <text x="810" y="70" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#cfd8e6">tools: create_issue, list_prs</text>
  <text x="810" y="84" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#cfd8e6">resources: repo://...</text>
  <text x="810" y="98" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#94a3b8">oauth / token</text>
  <rect x="450" y="210" width="220" height="70" rx="10" fill="#0f172a" stroke="#22d3ee"/>
  <text x="560" y="210" text-anchor="middle" font-family="Inter, sans-serif" font-size="12" font-weight="700" fill="#22d3ee" dy="20">Postgres server</text>
  <text x="560" y="240" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#cfd8e6">tools: run_query (read-only)</text>
  <text x="560" y="254" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#cfd8e6">resources: table://...</text>
  <text x="560" y="268" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#94a3b8">read replica</text>
  <rect x="700" y="210" width="220" height="70" rx="10" fill="#0f172a" stroke="#fb7185"/>
  <text x="810" y="210" text-anchor="middle" font-family="Inter, sans-serif" font-size="12" font-weight="700" fill="#fb7185" dy="20">Browser server</text>
  <text x="810" y="240" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#cfd8e6">tools: navigate, click, type</text>
  <text x="810" y="254" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#cfd8e6">resources: screenshot://</text>
  <text x="810" y="268" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#94a3b8">isolated profile</text>
  <line x1="220" y1="160" x2="270" y2="160" stroke="#94a3b8" marker-end="url(#arr-mcp)"/>
  <line x1="390" y1="140" x2="450" y2="80" stroke="#94a3b8" marker-end="url(#arr-mcp)"/>
  <line x1="390" y1="150" x2="700" y2="80" stroke="#94a3b8" marker-end="url(#arr-mcp)"/>
  <line x1="390" y1="180" x2="450" y2="240" stroke="#94a3b8" marker-end="url(#arr-mcp)"/>
  <line x1="390" y1="190" x2="700" y2="240" stroke="#94a3b8" marker-end="url(#arr-mcp)"/>
</svg>'''

# Diagram 2: tool result decision tree
result_tree = '''<svg viewBox="0 0 1100 380" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="How a tool result flows through the agent">
  <defs>
    <marker id="arr-r" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
      <path d="M0,0 L6,4 L0,8 Z" fill="#94a3b8"/>
    </marker>
  </defs>
  <rect x="40" y="40" width="180" height="60" rx="8" fill="#0f172a" stroke="#22d3ee"/>
  <text x="130" y="68" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" fill="#22d3ee">Tool call</text>
  <text x="130" y="84" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#94a3b8">from model</text>
  <rect x="280" y="40" width="180" height="60" rx="8" fill="#0f172a" stroke="#a78bfa"/>
  <text x="370" y="68" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" fill="#a78bfa">Wrapper</text>
  <text x="370" y="84" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#94a3b8">auth + rate limit</text>
  <rect x="520" y="40" width="180" height="60" rx="8" fill="#0f172a" stroke="#34d399"/>
  <text x="610" y="68" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" fill="#34d399">API call</text>
  <text x="610" y="84" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#94a3b8">real backend</text>
  <line x1="220" y1="70" x2="280" y2="70" stroke="#94a3b8" marker-end="url(#arr-r)"/>
  <line x1="460" y1="70" x2="520" y2="70" stroke="#94a3b8" marker-end="url(#arr-r)"/>
  <rect x="760" y="40" width="180" height="60" rx="8" fill="#0f172a" stroke="#22d3ee"/>
  <text x="850" y="68" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" fill="#22d3ee">Formatter</text>
  <text x="850" y="84" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#94a3b8">trim + redact</text>
  <line x1="700" y1="70" x2="760" y2="70" stroke="#94a3b8" marker-end="url(#arr-r)"/>
  <rect x="1000" y="40" width="80" height="60" rx="8" fill="#111827" stroke="#22d3ee"/>
  <text x="1040" y="68" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" fill="#22d3ee">Model</text>
  <text x="1040" y="84" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#94a3b8">reads</text>
  <line x1="940" y1="70" x2="1000" y2="70" stroke="#94a3b8" marker-end="url(#arr-r)"/>
  <rect x="40" y="180" width="240" height="60" rx="8" fill="#0f172a" stroke="#fb7185"/>
  <text x="160" y="208" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" fill="#fb7185">If error: {ok:false,error}</text>
  <text x="160" y="224" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#94a3b8">retryable + retry_after</text>
  <rect x="320" y="180" width="240" height="60" rx="8" fill="#0f172a" stroke="#fbbf24"/>
  <text x="440" y="208" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" fill="#fbbf24">If success: trim top N</text>
  <text x="440" y="224" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#94a3b8">Markdown table + 1-line summary</text>
  <rect x="600" y="180" width="240" height="60" rx="8" fill="#0f172a" stroke="#34d399"/>
  <text x="720" y="208" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" fill="#34d399">If large: paginate</text>
  <text x="720" y="224" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#94a3b8">next_cursor + has_more</text>
  <text x="40" y="290" font-family="JetBrains Mono, monospace" font-size="10" fill="#94a3b8">Every tool result passes through: auth → API → format → model. The wrapper owns auth and rate limit; the formatter owns trim and redact; the model only sees the final shape.</text>
</svg>'''

# Inject diagram into "MCP architecture" h3 (subtopic 3)
# And into "Result shape for the common cases" h3 (subtopic 6, last)
# Map: subtopic idx (0-based) → h3 idx
# Subtopic 2 (MCP) has 7 h3s; the 1st h3 is "Why MCP exists" and the 2nd is "The three primitives"
# Inject the MCP architecture diagram into the "MCP architecture" h3 (3rd h3 in subtopic 2)
# For result shapes, inject into the "Reference: result shape" h3 (last h3 in subtopic 5)

# Find subtopic 2 (MCP) and add diagram to its 3rd h3
data["subtopics"][2]["h3s"][2]["diagram"] = mcp_diagram

# Find subtopic 5 (Result formatting) and add diagram to its last h3
data["subtopics"][5]["h3s"][-1]["diagram"] = result_tree

# Also bump diagramCount
data["diagramCount"] = 2

# Write back
with open(META, "w") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
print(f"✓ 02.json updated with 2 diagrams")
print(f"  diagram 1 → subtopic 2 (MCP), h3 idx 2 (architecture)")
print(f"  diagram 2 → subtopic 5 (Result formatting), last h3")
