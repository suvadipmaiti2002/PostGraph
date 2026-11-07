from typing import Dict, Any
from loguru import logger
from langchain_core.prompts import ChatPromptTemplate
from app.agent.graph.graph_state import BlogState
from app.agent.llm.llm_factory import get_llm


async def editor_node(state: BlogState) -> Dict[str, Any]:
    """
    Audits the educational technical draft:
    - Verifies technical claims and metrics against research sources.
    - Injects verified markdown citations [Source Title](url).
    - Preserves all intuitive analogies, mental models, and Mermaid diagrams.
    - Ensures ## References contains active, clickable markdown links.
    """
    topic = state.get("topic", "")
    draft = state.get("draft", "")
    sources = state.get("research_sources", [])

    logger.info("🧐 [Editor Node] Fact-checking and polishing article for: '{}'", topic)

    sources_text = "\n\n".join(
        [f"- [{s['title']}]({s['url']})\n  Key Content: {s['content'][:400]}" for s in sources]
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a senior technical editor. Audit and polish the educational technical article against the research sources.

Editorial Rules:
1. Preserve Teaching Tools: Strictly preserve the H1 headline, the real-world analogy, the Rule of Thumb, and all Mermaid diagrams. Do not strip them.
2. Fact-Checking: Verify technical claims against the research sources. Correct any technical inaccuracies.
3. In-Text Citations: Add markdown links [Source Title](url) wherever documentation, benchmarks, or external concepts are discussed.
4. Mermaid Syntax Guard: Ensure node labels in Mermaid diagrams containing parentheses, colons, or slashes are quoted in double quotes (e.g. B["Label (Info)"]).
5. Prune Clichés: Remove generic throat-clearing clichés ("In today's fast-paced world...", "Without further ado").
6. Clickable References: The '## References' section MUST contain bulleted markdown links:
   - [Source Title](exact_url)
   Never output plain-text names or numbers without the URL.
"""),
        ("user", """Original Draft:
{draft}

Research Sources:
{sources}

Output the finalized, citation-verified, educational technical article now:""")
    ])

    llm = get_llm()
    chain = prompt | llm

    response = await chain.ainvoke({
        "draft": draft,
        "sources": sources_text or "No external sources recorded."
    })

    logger.success("🎉 [Editor Node] Final audited technical blog compiled ({} chars).", len(response.content))
    return {
        "final_blog": response.content,
        "current_stage": "completed"
    }
