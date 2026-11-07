from typing import Dict, Any
from loguru import logger
from langchain_core.prompts import ChatPromptTemplate
from app.agent.graph.graph_state import BlogState
from app.agent.llm.llm_factory import get_llm
from app.agent.tools.research_tool import search_web_sources


async def researcher_node(state: BlogState) -> Dict[str, Any]:
    """
    Researches the technical topic using 3 focused web sources and produces
    a concise, scannable Research Brief & Blueprint (~200 words) for Gate 1 review.
    Does NOT write the article—plans the architecture and sources for the Writer.
    """
    topic = state.get("topic", "")
    audience = state.get("audience", "Engineers & Developers")
    style = state.get("style", "intuitive")
    existing_sources = state.get("research_sources") or []
    feedback = state.get("human_feedback")

    logger.info("🔬 [Researcher Node] Synthesizing research blueprint for: '{}' (style: {})", topic, style)

    # 1. Fetch exactly 3 sources on the first run
    if not existing_sources:
        logger.info("🌐 [1st Run Only] Fetching 3 technical web sources via Tavily...")
        sources = await search_web_sources(topic=topic, audience=audience, max_results=3)
    else:
        logger.info("♻️ [Cached] Reusing {} sources (zero search API cost).", len(existing_sources))
        sources = existing_sources

    # Format sources for LLM context
    sources_text = "\n\n".join(
        [f"- [{s['title']}]({s['url']})\n  Key Content: {s['content'][:350]}..." for s in sources]
    )

    # 2. Outline synthesis prompt: Blueprint only (no full article)
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a Technical Research Lead and Architect.
Your task is to synthesize external research sources into a concise, scannable Research Brief & Editorial Blueprint (~200-400 words).
CRITICAL: Do NOT write the article itself. Do NOT output full narratives, full paragraphs, or final diagrams.
Your output is a high-level blueprint that the human will review and approve at Gate 1 before the Writer creates the full piece.

Strict Output Format:
# Research Brief & Editorial Plan: [Topic]

### 1. Target Angle & Core Challenge
- 1-2 bullet points: The real-world problem or developer bottleneck we are solving for {audience}.

### 2. Verified Primary Sources Found
- List all 3 sources as clickable links: [Source Title](URL) — 1-sentence note on the key facts/specs this source provides.

### 3. Proposed Teaching Analogy & Mental Model
- The proposed everyday metaphor to use (e.g., "USB-C universal port for AI apps" or "A restaurant kitchen brigade").
- Proposed 1-sentence "Rule of Thumb" to remember forever.

### 4. Planned Visual Architecture Flow
- 1-2 sentences describing the planned Mermaid diagram (e.g., Host App -> Client -> JSON-RPC -> Local/Remote Server -> Tools).

### 5. Article Outline (What the Writer will expand into a full 1,000+ word article)
- Bulleted list of the 6 sections to be written.
"""),
        ("user", """Topic: {topic}
Audience: {audience}
Style: {style}

Web Research Sources:
{sources}

Reviewer Feedback to Address (if any):
{feedback}

Output the concise Research Brief & Editorial Blueprint now:""")
    ])

    llm = get_llm()
    chain = prompt | llm
    
    response = await chain.ainvoke({
        "topic": topic,
        "audience": audience,
        "style": style,
        "sources": sources_text or "No web sources found; rely on modern industry standards.",
        "feedback": feedback or "No previous feedback. Initial outline."
    })

    logger.success("✅ [Researcher Node] Strategic research brief generated ({} chars).", len(response.content))
    return {
        "research_sources": sources,
        "research_summary": response.content,
        "current_stage": "awaiting_research_review"
    }
