from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from app.core.config import settings
from app.repositories import checkpoint_repo
from app.api.v1.controllers import blog_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manages application startup and shutdown lifecycle.
    """
    logger.info("🚀 Starting PostGraph Backend Engine...")
    await checkpoint_repo.setup()
    yield
    logger.info("🛑 Shutting down PostGraph Backend Engine...")


app = FastAPI(
    title="PostGraph — Multi-Agent Blog Generation Engine",
    description="Autonomous cyclical state-graph technical blog engine with dual Human-in-the-Loop checkpoints.",
    version="1.0.0",
    lifespan=lifespan
)

# Parse CORS origins
cors_origins = settings.CORS_ORIGINS
if isinstance(cors_origins, str):
    cors_origins = [o.strip() for o in cors_origins.split(",") if o.strip()]

# Configure CORS: allows localhost development + all Vercel deployments automatically
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(blog_router, prefix="/api/v1")


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": "PostGraph Engine",
        "environment": settings.ENVIRONMENT
    }


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Welcome to PostGraph API! Access documentation at /docs",
        "docs_url": "/docs"
    }
