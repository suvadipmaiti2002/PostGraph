from typing import List, Dict
from loguru import logger
from tavily import AsyncTavilyClient
from app.core.config import settings
from app.agent.llm import get_llm
from langchain_core.prompts import ChatPromptTemplate


async def generate_single_search_query(topic: str, audience: str) -> str:
    """
    Dynamically crafts 1 high-signal search query specifically targeting
    technical documentation, architecture, code patterns, and benchmarks.
    """
    llm = get_llm()

    prompt = ChatPromptTemplate.from_template(
        "Task: Formulate 1 precise technical web search query for the topic '{topic}' targeted at '{audience}'.\n"
        "Focus: Official engineering documentation, architecture patterns, implementation code, and benchmarks.\n"
        "Constraint: Output ONLY the search query string with no quotes or conversational filler."
    )
    chain = prompt | llm

    try:
        res = await chain.ainvoke({"topic": topic, "audience": audience})
        query = res.content.strip().strip('"').strip("'")
        logger.info("🧠 Formulated technical search query: '{}'", query)
        return query
    except Exception as e:
        logger.warning("Failed to generate dynamic query ({}), using fallback.", e)
        return f"{topic} architecture implementation guide for {audience}"


async def search_web_sources(topic: str, audience: str = "Software Engineers", max_results: int = 3) -> List[Dict[str, str]]:
    """
    Executes a single, non-blocking high-density search via Tavily (costs 1 API credit).
    Returns up to 3 focused, authoritative technical sources asynchronously.
    """
    if not settings.TAVILY_API_KEY:
        logger.error("❌ TAVILY_API_KEY is not set in .env! Cannot perform web search.")
        return []

    client = AsyncTavilyClient(api_key=settings.TAVILY_API_KEY)
    
    search_query = await generate_single_search_query(topic=topic, audience=audience)
    
    logger.info("🔍 [Async] Querying Tavily with: '{}'", search_query)
    try:
        response = await client.search(
            query=search_query,
            search_depth="advanced",
            max_results=max_results,
            include_raw_content=False
        )
        
        sources = []
        for res in response.get("results", []):
            url = res.get("url")
            if url:
                sources.append({
                    "title": res.get("title", "Untitled Source"),
                    "url": url,
                    "content": res.get("content", "")
                })

        logger.success("✅ [Async] Retrieved {} authoritative technical sources in 1 API call.", len(sources))
        return sources

    except Exception as e:
        logger.error("❌ Error querying Tavily asynchronously: {}", e)
        return []
