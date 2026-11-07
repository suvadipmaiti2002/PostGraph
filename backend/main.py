import os
import uvicorn


def main():
    """
    Entrypoint to start the Uvicorn ASGI server hosting app.app:app.
    Supports dynamic PORT for cloud providers (Render, Railway, etc.).
    """
    port = int(os.environ.get("PORT", 8000))
    is_dev = os.environ.get("ENVIRONMENT", "development").lower() == "development"
    
    uvicorn.run(
        "app.app:app",
        host="0.0.0.0",
        port=port,
        reload=is_dev
    )


if __name__ == "__main__":
    main()
