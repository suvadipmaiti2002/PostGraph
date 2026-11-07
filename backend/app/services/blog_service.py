import uuid
from typing import Dict, Any, Optional
from loguru import logger
from langgraph.types import Command
from app.agent.graph.workflow import create_blog_graph
from app.repositories.checkpoint_repository import checkpoint_repo


class BlogService:
    def __init__(self):
        # Compile graph once with our repository's checkpointer
        checkpointer = checkpoint_repo.get_checkpointer()
        self.graph = create_blog_graph(checkpointer=checkpointer)
        logger.info("🚀 BlogService initialized with compiled LangGraph workflow.")

    async def start_workflow(self, topic: str, audience: str, style: str = "intuitive") -> Dict[str, Any]:
        """
        Starts a new blog workflow with a unique thread_id.
        Runs until the first interrupt (Gate 1: Review Research).
        """
        thread_id = str(uuid.uuid4())
        config = {"configurable": {"thread_id": thread_id}}

        initial_state = {
            "topic": topic,
            "audience": audience,
            "style": style or "intuitive",
            "revision_count": 0,
            "max_revisions": 2
        }

        logger.info("🎬 [Thread {}] Starting new blog generation topic: '{}', style: '{}'", thread_id, topic, style)

        # Run until Gate 1 interrupt
        await self.graph.ainvoke(initial_state, config=config)
        return await self._format_state_response(thread_id, config)

    async def resume_workflow(self, thread_id: str, action: str, feedback: str = "") -> Dict[str, Any]:
        """
        Resumes an existing workflow from Gate 1 or Gate 2 using Command(resume=...).
        Runs until the next gate or workflow completion.
        """
        config = {"configurable": {"thread_id": thread_id}}

        logger.info("▶️ [Thread {}] Resuming workflow with action: '{}', feedback: '{}'", thread_id, action, feedback)

        # Inspect current state to ensure the session exists and is paused at an interrupt
        snapshot = self.graph.get_state(config)
        if not snapshot.values:
            logger.warning("⚠️ [Thread {}] State not found or expired.", thread_id)
            raise ValueError(
                f"Session '{thread_id}' was not found or expired (e.g. server restarted). Please start a new article."
            )

        if not snapshot.interrupts:
            logger.warning("⚠️ [Thread {}] Thread is not currently paused at a review gate.", thread_id)
            raise ValueError(
                f"Session '{thread_id}' is not currently awaiting review (status: {snapshot.values.get('current_stage', 'done')})."
            )

        # Resume execution with the human's decision
        await self.graph.ainvoke(
            Command(resume={"action": action, "feedback": feedback}),
            config=config
        )
        return await self._format_state_response(thread_id, config)

    async def get_workflow_state(self, thread_id: str) -> Dict[str, Any]:
        """
        Fetches the current snapshot of a workflow thread without mutating state.
        """
        config = {"configurable": {"thread_id": thread_id}}
        return await self._format_state_response(thread_id, config)

    async def _format_state_response(self, thread_id: str, config: dict) -> Dict[str, Any]:
        """
        Inspects the LangGraph snapshot and formats a clean JSON response for API/UI.
        """
        snapshot = self.graph.get_state(config)

        # If the thread does not exist in the checkpointer
        if not snapshot.values and not snapshot.interrupts:
            raise ValueError(f"Session '{thread_id}' was not found or has expired.")

        # 1. If currently paused at an interrupt (Gate 1 or Gate 2)
        if snapshot.interrupts:
            interrupt_payload = snapshot.interrupts[0].value
            return {
                "thread_id": thread_id,
                "status": "awaiting_approval",
                "stage": interrupt_payload.get("stage"),
                "content_for_review": interrupt_payload.get("data"),
                "sources": interrupt_payload.get("sources", []),
                "revision_count": interrupt_payload.get("revision_count", 0),
                "max_revisions": interrupt_payload.get("max_revisions", 2)
            }

        # 2. If workflow has reached the end (__end__)
        if "final_blog" in snapshot.values:
            return {
                "thread_id": thread_id,
                "status": "completed",
                "stage": "completed",
                "final_blog": snapshot.values.get("final_blog")
            }

        # 3. Fallback in-progress status
        return {
            "thread_id": thread_id,
            "status": "in_progress",
            "stage": snapshot.values.get("current_stage", "running")
        }


# Global singleton instance
blog_service = BlogService()
