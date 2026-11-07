from loguru import logger
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from app.core.config import settings


def get_llm():
    """
    Returns the primary LLM (Groq Llama 3.3 70B) with automated fallback
    to Google Gemini 1.5 Flash.
    Configured with max_tokens=8192 to prevent mid-generation cutoffs on long technical blogs.
    """
    primary_llm = ChatGroq(
        model=settings.GROQ_MODEL,
        api_key=settings.GROQ_API_KEY,
        temperature=0.7,
        max_tokens=8192,         # Allows full long-form articles without truncation
        request_timeout=90.0,    # Generous timeout for long technical drafts
        max_retries=1,
    )

    fallback_llm = ChatGoogleGenerativeAI(
        model=settings.GEMINI_MODEL,
        google_api_key=settings.GEMINI_API_KEY,
        temperature=0.7,
        max_output_tokens=8192,  # Full token capacity on Gemini
        request_timeout=90.0,
    )

    return primary_llm.with_fallbacks([fallback_llm])
