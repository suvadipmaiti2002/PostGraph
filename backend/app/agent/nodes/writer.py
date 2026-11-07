from typing import Dict, Any
from loguru import logger
from langchain_core.prompts import ChatPromptTemplate
from app.agent.graph.graph_state import BlogState
from app.agent.llm.llm_factory import get_llm


async def writer_node(state: BlogState) -> Dict[str, Any]:
    """
    Transforms approved research blueprint into a full-length, visual,
    easy-to-understand technical article (1,000–1,400 words) using the Feynman Technique.
    """
    topic = state.get("topic", "")
    audience = state.get("audience", "Engineers & Developers")
    style = state.get("style", "intuitive")
    outline = state.get("research_summary", "")
    sources = state.get("research_sources", [])
    feedback = state.get("human_feedback")

    logger.info("✍️ [Writer Node] Expanding blueprint into full visual article for: '{}' (style: {})", topic, style)

    # Format sources with exact markdown links
    sources_reference = "\n".join([f"- [{s['title']}]({s['url']})" for s in sources])

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are an exceptional technical educator applying the Feynman Technique.
Your task is to take the approved Research Brief & Editorial Plan and expand it into a complete, full-length (1,000 to 1,400 word) masterclass technical article.
Your goal is deep intuition, visual clarity, and permanent memory retention.

Core Rules:
1. No Unexplained Jargon:
   - When introducing technical terms, immediately explain what they mean in plain English in the same sentence.
2. Mental Model & Everyday Analogy:
   - Deeply develop the everyday analogy planned in the brief (e.g. coffee shop, restaurant kitchen, post office, USB-C adapter) so the reader forms an instant mental image.
3. Diagrams Over Code (Priority):
   - Always provide a full, working Mermaid diagram (```mermaid\\nflowchart TD ...```) with human-friendly labels.
   - CRITICAL MERMAID SYNTAX: Always wrap node text containing parentheses, colons, or slashes in double quotes: e.g. B["Event Loop (single thread)"] or F["OS Polling (epoll/kqueue)"], NEVER B[Event Loop (single thread)]. Unquoted parentheses inside brackets crash Mermaid.
   - Include code ONLY if the topic specifically asks for syntax/implementation. If the topic is conceptual, architectural, or comparative (e.g. Sync vs Async, Kafka vs RabbitMQ, SQL vs NoSQL, RAG, MCP), SKIP code and focus on the visual diagram and step-by-step scenario walkthrough instead.

Article Structure to Expand:
# <Clear, Engaging Technical Title>

A friendly 2-sentence opening hook on the core problem and why it matters to developers.

## The Intuitive Mental Model
- The Everyday Analogy: A vivid real-world comparison that explains the concept before touching code or architecture.
- First-Principles Concept: Plain-English explanation of what the underlying system/computer is actually doing.
- The Rule of Thumb: 1 bolded takeaway sentence to remember permanently.

## What Problem Does This Actually Solve?
- The pain points and bottlenecks of the naive / old way (why developers got frustrated).
- The breakthrough moment that led to this modern pattern.

## Architecture & Visual Data Flow
- Step-by-step walkthrough of how data/requests travel through the system.
- Full Mermaid visual diagram with clean, friendly labels.
- Plain-English comparison table contrasting the options or components.

## Practical Implementation & Real-World Flow
- If implementation-focused: a clean 15-20 line code snippet with plain-English comments.
- If architectural/conceptual: a concrete, step-by-step scenario walkthrough (e.g. "What happens when a user clicks 'Submit'").

## When to Use It (And When NOT To)
- Clear criteria on when to adopt it vs when it is unnecessary overkill.

## Common Gotchas & Fixes
- 2 real-world pitfalls with practical, actionable fixes.

## References
- Exactly 3 verified, clickable Markdown links: [Source Title](URL).
  Use the EXACT URLs provided in the reference sources.

Constraints:
- Length: 1,000 to 1,400 words total. Provide thorough explanations, rich storytelling, and visual clarity without robotic fluff.
- Tone: Friendly, educational, approachable, and engineering-first for {audience}.
"""),
        ("user", """Topic: {topic}
Audience: {audience}
Style: {style}

Approved Research Blueprint:
{outline}

Verified Reference Sources (Use these exact URLs in ## References):
{sources}

Reviewer Feedback:
{feedback}

Expand this blueprint into the complete 1,000+ word visual technical article now:""")
    ])

    llm = get_llm()
    chain = prompt | llm

    response = await chain.ainvoke({
        "topic": topic,
        "audience": audience,
        "style": style,
        "outline": outline,
        "sources": sources_reference,
        "feedback": feedback or "Initial draft generation based on approved outline."
    })

    logger.success("✅ [Writer Node] Full visual article drafted ({} chars).", len(response.content))
    return {
        "draft": response.content,
        "current_stage": "awaiting_draft_review"
    }
