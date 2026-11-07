from typing import Optional, List, Dict, Literal
from pydantic import BaseModel, Field


class BlogStartRequest(BaseModel):
    topic: str = Field(
        ...,
        min_length=3,
        max_length=200,
        description="The topic of the blog post",
        examples=["Building High-Performance Event-Driven Microservices in Go"]
    )
    audience: str = Field(
        default="Software Engineers",
        description="Target audience reading the article",
        examples=["Software Engineers & Developers"]
    )
    style: Optional[str] = Field(
        default="intuitive",
        description="Writing tone/style: 'intuitive' (friendly, plain English, analogies), 'practical' (direct developer patterns), or 'deep' (advanced architectural specs)"
    )


class BlogResumeRequest(BaseModel):
    thread_id: str = Field(
        ...,
        description="The unique session thread ID of the blog generation"
    )
    action: Literal["approve", "revise"] = Field(
        ...,
        description="Action to take: 'approve' to advance or 'revise' to loop back"
    )
    feedback: Optional[str] = Field(
        default="",
        description="Optional feedback or revision instructions for the agent"
    )


class BlogResponse(BaseModel):
    thread_id: str
    status: Literal["awaiting_approval", "in_progress", "completed", "error"]
    stage: Optional[str] = None
    content_for_review: Optional[str] = None
    sources: Optional[List[Dict[str, str]]] = None
    revision_count: Optional[int] = 0
    max_revisions: Optional[int] = 2
    final_blog: Optional[str] = None
