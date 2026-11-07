from loguru import logger
from langgraph.checkpoint.memory import MemorySaver


class CheckpointRepository:
    """
    Data Access Layer for LangGraph state persistence.
    Uses in-memory storage for rapid local development,
    with an isolated boundary ready to swap with AsyncPostgresSaver for production.
    """
    def __init__(self):
        logger.info("🧠 Initializing CheckpointRepository with MemorySaver (In-Memory).")
        self._checkpointer = MemorySaver()

    def get_checkpointer(self) -> MemorySaver:
        return self._checkpointer

    async def setup(self):
        """No-op for in-memory; will run table setup when switched to PostgreSQL."""
        pass


# Global singleton instance
checkpoint_repo = CheckpointRepository()