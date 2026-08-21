import os
from typing import List, Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # App info
    PROJECT_NAME: str = "Engineering Knowledge Intelligence System (EKIS)"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"

    # LLM Settings
    OPENAI_API_KEY: Optional[str] = Field(default=None)
    OPENAI_API_BASE: str = "https://api.openai.com/v1"
    LLM_MODEL: str = "gpt-4o-mini"
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    LLM_TEMPERATURE: float = 0.1
    LLM_MAX_TOKENS: int = 1500

    # Vector DB (Qdrant)
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    QDRANT_API_KEY: Optional[str] = None
    QDRANT_COLLECTION: str = "ekis_engineering_knowledge"
    QDRANT_EMBEDDING_DIM: int = 384
    USE_IN_MEMORY_QDRANT: bool = True

    # Graph DB (Neo4j)
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = "password123"
    USE_IN_MEMORY_GRAPH: bool = True

    # Metadata DB
    DATABASE_URL: str = "sqlite:///./data/ekis_metadata.db"

    # Retrieval & Relevance Thresholds
    RETRIEVAL_TOP_K_VECTOR: int = 8
    RETRIEVAL_TOP_K_BM25: int = 8
    RETRIEVAL_TOP_K_GRAPH: int = 5
    RETRIEVAL_RRF_K: int = 60
    RETRIEVAL_RERANK_TOP_N: int = 5
    MIN_CONFIDENCE_THRESHOLD: float = 0.35
    MIN_RELEVANCE_THRESHOLD: float = 0.40
    OUT_OF_DOMAIN_REFUSAL_MESSAGE: str = "I could not find relevant information in the engineering knowledge base."

    # Storage Paths
    DATA_DIR: str = "./data"
    DOCS_DIR: str = "./data/docs"
    UPLOADS_DIR: str = "./data/uploads"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]


settings = Settings()
