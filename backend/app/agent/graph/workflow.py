from typing import Dict, Any, Optional
from loguru import logger
from langgraph.graph import StateGraph, START, END
from langgraph.types import interrupt
from app.agent.graph.graph_state import BlogState
from app.agent.nodes.researcher import researcher_node
from app.agent.nodes.writer import writer_node
from app.agent.nodes.editor import editor_node


# --- Human-in-the-Loop Review Nodes ---

def review_research_node(state: BlogState) -> Dict[str, Any]:
    """
    Gate 1: Halts graph execution and yields the research outline to the human.
    When resumed with Command(resume={'action': '...', 'feedback': '...'}),
    it captures the human's input.
    """
    logger.info("⏸️ [Gate 1] Awaiting human review on research outline...")
    
    human_response: Dict[str, Any] = interrupt({
        "stage": "review_research",
        "topic": state.get("topic"),
        "audience": state.get("audience"),
        "data": state.get("research_summary", ""),
        "sources": state.get("research_sources", []),
        "revision_count": state.get("revision_count", 0),
        "max_revisions": state.get("max_revisions", 2)
    })

    action = human_response.get("action", "approve")
    feedback = human_response.get("feedback", "")
    current_revisions = state.get("revision_count", 0)

    # Increment loop counter if revision is requested; reset if approved
    new_revisions = (current_revisions + 1) if action == "revise" else 0

    return {
        "human_feedback": feedback,
        "review_action": action,
        "revision_count": new_revisions
    }


def review_draft_node(state: BlogState) -> Dict[str, Any]:
    """
    Gate 2: Halts graph execution and yields the draft article to the human.
    """
    logger.info("⏸️ [Gate 2] Awaiting human review on draft article...")
    
    human_response: Dict[str, Any] = interrupt({
        "stage": "review_draft",
        "topic": state.get("topic"),
        "audience": state.get("audience"),
        "data": state.get("draft", ""),
        "revision_count": state.get("revision_count", 0),
        "max_revisions": state.get("max_revisions", 2)
    })

    action = human_response.get("action", "approve")
    feedback = human_response.get("feedback", "")
    current_revisions = state.get("revision_count", 0)

    new_revisions = (current_revisions + 1) if action == "revise" else 0

    return {
        "human_feedback": feedback,
        "review_action": action,
        "revision_count": new_revisions
    }


# --- Conditional Routing Guardrails ---

def route_research_review(state: BlogState) -> str:
    """
    Routes between 'researcher' (loop) and 'writer' (advance),
    enforcing loop termination if max_revisions is reached.
    """
    action = state.get("review_action", "approve")
    rev_count = state.get("revision_count", 0)
    max_rev = state.get("max_revisions", 2)

    if action == "revise":
        if rev_count <= max_rev:
            logger.info("🔁 Research outline revision requested ({}/{}). Looping back.", rev_count, max_rev)
            return "researcher"
        else:
            logger.warning("⚠️ Max revisions reached ({}/{}). Enforcing progression to Writer.", rev_count - 1, max_rev)
            return "writer"

    logger.success("✅ Research outline approved. Advancing to Writer node.")
    return "writer"


def route_draft_review(state: BlogState) -> str:
    """
    Routes between 'writer' (loop) and 'editor' (advance),
    enforcing loop termination if max_revisions is reached.
    """
    action = state.get("review_action", "approve")
    rev_count = state.get("revision_count", 0)
    max_rev = state.get("max_revisions", 2)

    if action == "revise":
        if rev_count <= max_rev:
            logger.info("🔁 Draft revision requested ({}/{}). Looping back.", rev_count, max_rev)
            return "writer"
        else:
            logger.warning("⚠️ Max revisions reached ({}/{}). Enforcing progression to Editor.", rev_count - 1, max_rev)
            return "editor"

    logger.success("✅ Draft approved. Advancing to Editor & Fact-Checker node.")
    return "editor"


# --- Graph Assembly Function ---

def create_blog_graph(checkpointer: Optional[Any] = None):
    """
    Compiles the PostGraph state machine.
    Accepts any LangGraph checkpointer (MemorySaver or AsyncPostgresSaver).
    """
    builder = StateGraph(BlogState)

    # 1. Add all Nodes
    builder.add_node("researcher", researcher_node)
    builder.add_node("review_research", review_research_node)
    builder.add_node("writer", writer_node)
    builder.add_node("review_draft", review_draft_node)
    builder.add_node("editor", editor_node)

    # 2. Build the Edges
    builder.add_edge(START, "researcher")
    builder.add_edge("researcher", "review_research")
    
    # Conditional Edge 1 (Gate 1 Loop or Advance)
    builder.add_conditional_edges(
        "review_research",
        route_research_review,
        ["researcher", "writer"]
    )

    builder.add_edge("writer", "review_draft")

    # Conditional Edge 2 (Gate 2 Loop or Advance)
    builder.add_conditional_edges(
        "review_draft",
        route_draft_review,
        ["writer", "editor"]
    )

    builder.add_edge("editor", END)

    # 3. Compile with Checkpointer
    return builder.compile(checkpointer=checkpointer)