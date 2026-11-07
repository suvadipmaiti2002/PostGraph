from fastapi import APIRouter, HTTPException, status
from loguru import logger
from app.api.v1.schemas.blog_schema import (
    BlogStartRequest,
    BlogResumeRequest,
    BlogResponse
)
from app.services.blog_service import blog_service

router = APIRouter(prefix="/blog", tags=["Blog Engine"])


@router.post(
    "/start",
    response_model=BlogResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Start Blog Workflow",
    description="Initiates web research and stops at Gate 1 (outline review)."
)
async def start_blog(request: BlogStartRequest):
    try:
        result = await blog_service.start_workflow(
            topic=request.topic,
            audience=request.audience,
            style=request.style or "intuitive"
        )
        return result
    except Exception as e:
        logger.error("Failed to start blog workflow: {}", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Workflow startup failed: {str(e)}"
        )


@router.post(
    "/resume",
    response_model=BlogResponse,
    status_code=status.HTTP_200_OK,
    summary="Resume Workflow",
    description="Resumes execution at Gate 1 or Gate 2 with human approval or feedback."
)
async def resume_blog(request: BlogResumeRequest):
    try:
        result = await blog_service.resume_workflow(
            thread_id=request.thread_id,
            action=request.action,
            feedback=request.feedback or ""
        )
        return result
    except ValueError as ve:
        logger.warning("Workflow resumption rejected for thread '{}': {}", request.thread_id, ve)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(ve)
        )
    except Exception as e:
        logger.error("Failed to resume thread '{}': {}", request.thread_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Workflow resumption failed: {str(e)}"
        )


@router.get(
    "/{thread_id}/state",
    response_model=BlogResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Thread State",
    description="Inspects the current state snapshot and review payload of an active thread."
)
async def get_blog_state(thread_id: str):
    try:
        result = await blog_service.get_workflow_state(thread_id)
        return result
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(ve)
        )
    except Exception as e:
        logger.error("Failed to fetch state for thread '{}': {}", thread_id, e)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Thread not found: {str(e)}"
        )
