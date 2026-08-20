from typing import Any, Dict, List, Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime
import uuid


# ----------------------------------------------------
# Document & Ingestion Schemas
# ----------------------------------------------------

class DocumentMetadata(BaseModel):
    source_type: str = Field(..., description="e.g. markdown, pdf, txt, code, adr, postmortem, runbook")
    file_name: str
    file_path: Optional[str] = None
    service_name: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    version: Optional[str] = "1.0"
    author: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    custom_attributes: Dict[str, Any] = Field(default_factory=dict)


class DocumentChunk(BaseModel):
    chunk_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    doc_id: str
    content: str
    chunk_index: int
    start_char: int = 0
    end_char: int = 0
    section_heading: Optional[str] = None
    metadata: DocumentMetadata
    token_count: Optional[int] = None
    embedding: Optional[List[float]] = None


class Document(BaseModel):
    doc_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: str
    metadata: DocumentMetadata
    chunks: List[DocumentChunk] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class IngestionRequest(BaseModel):
    title: str
    content: str
    source_type: str = "markdown"
    file_name: str
    service_name: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    custom_attributes: Dict[str, Any] = Field(default_factory=dict)


class IngestionResponse(BaseModel):
    doc_id: str
    title: str
    chunks_count: int
    entities_extracted: int
    relationships_extracted: int
    indexed_in_vector_db: bool
    indexed_in_keyword_index: bool
    indexed_in_graph_db: bool
    status: str = "success"
    message: str = "Document successfully ingested and indexed."


# ----------------------------------------------------
# Knowledge Graph Schemas
# ----------------------------------------------------

class EntityType(str):
    SERVICE = "Service"
    COMPONENT = "Component"
    API_ENDPOINT = "ApiEndpoint"
    CONFIG = "Config"
    ERROR_CODE = "ErrorCode"
    INCIDENT = "Incident"
    ADR = "ADR"
    DEPENDENCY = "Dependency"
    DATABASE = "Database"
    DEPLOYMENT = "Deployment"


class RelationType(str):
    CALLS = "CALLS"
    DEPENDS_ON = "DEPENDS_ON"
    CONFIGURED_BY = "CONFIGURED_BY"
    CAUSES = "CAUSES"
    RESOLVED_BY = "RESOLVED_BY"
    DEFINES = "DEFINES"
    DEPRECATES = "DEPRECATES"
    DOCUMENTS = "DOCUMENTS"


class GraphNode(BaseModel):
    id: str
    label: str
    entity_type: str
    properties: Dict[str, Any] = Field(default_factory=dict)
    doc_id: Optional[str] = None
    chunk_id: Optional[str] = None


class GraphEdge(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    source: str
    target: str
    relation: str
    properties: Dict[str, Any] = Field(default_factory=dict)
    weight: float = 1.0


class GraphSubgraph(BaseModel):
    nodes: List[GraphNode] = Field(default_factory=list)
    edges: List[GraphEdge] = Field(default_factory=list)


# ----------------------------------------------------
# Retrieval & Reranker Schemas
# ----------------------------------------------------

class RetrievedChunk(BaseModel):
    chunk_id: str
    doc_id: str
    content: str
    source_type: str
    file_name: str
    service_name: Optional[str] = None
    section_heading: Optional[str] = None
    score: float
    retrieval_source: Literal["vector", "bm25", "graph", "hybrid", "reranked"]
    metadata: Dict[str, Any] = Field(default_factory=dict)


class VectorSearchResult(BaseModel):
    chunk_id: str
    doc_id: str
    content: str
    similarity_score: float
    rank: int
    metadata: Dict[str, Any] = Field(default_factory=dict)


class BM25SearchResult(BaseModel):
    chunk_id: str
    doc_id: str
    content: str
    bm25_score: float
    rank: int
    metadata: Dict[str, Any] = Field(default_factory=dict)


class GraphSearchResult(BaseModel):
    chunk_id: Optional[str] = None
    doc_id: Optional[str] = None
    entity_id: str
    entity_label: str
    entity_type: str
    related_entities: List[Dict[str, Any]] = Field(default_factory=list)
    relationship_path: str
    relevance_score: float
    rank: int


class RRFResult(BaseModel):
    chunk_id: str
    doc_id: str
    content: str
    vector_rank: Optional[int] = None
    bm25_rank: Optional[int] = None
    graph_rank: Optional[int] = None
    rrf_score: float
    metadata: Dict[str, Any] = Field(default_factory=dict)


class RetrievalDebuggerTrace(BaseModel):
    query: str
    query_intent: str
    extracted_entities: List[str]
    vector_results: List[VectorSearchResult] = Field(default_factory=list)
    bm25_results: List[BM25SearchResult] = Field(default_factory=list)
    graph_results: List[GraphSearchResult] = Field(default_factory=list)
    fused_results: List[RRFResult] = Field(default_factory=list)
    reranked_results: List[RetrievedChunk] = Field(default_factory=list)
    total_retrieval_time_ms: float = 0.0


# ----------------------------------------------------
# Citation & Generation Schemas
# ----------------------------------------------------

class Citation(BaseModel):
    citation_id: int
    source_tag: str  # e.g., "[SOURCE-1]"
    doc_id: str
    chunk_id: str
    file_name: str
    source_type: str
    section_heading: Optional[str] = None
    service_name: Optional[str] = None
    exact_quote_or_span: Optional[str] = None
    confidence: float = 1.0


class ConfidenceLevel(str):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    UNRELIABLE = "UNRELIABLE"


class ConfidenceIndicator(BaseModel):
    score: float = Field(..., ge=0.0, le=1.0)
    level: str  # HIGH, MEDIUM, LOW, UNRELIABLE
    reasoning: str
    is_sufficient_evidence: bool = True
    contradictions_found: List[str] = Field(default_factory=list)


class QueryRequest(BaseModel):
    query: str = Field(..., min_length=2, description="The technical engineering question")
    use_vector: bool = True
    use_bm25: bool = True
    use_graph: bool = True
    use_reranker: bool = True
    top_k: int = 5
    filter_service: Optional[str] = None
    filter_source_type: Optional[str] = None


class AnswerResponse(BaseModel):
    query: str
    direct_answer: str
    detailed_explanation: str
    evidence_summary: str
    citations: List[Citation] = Field(default_factory=list)
    confidence: ConfidenceIndicator
    related_services: List[str] = Field(default_factory=list)
    related_entities: List[str] = Field(default_factory=list)
    retrieved_sources: List[RetrievedChunk] = Field(default_factory=list)
    debug_trace: Optional[RetrievalDebuggerTrace] = None
    latency_ms: float = 0.0


# ----------------------------------------------------
# Evaluation Schemas
# ----------------------------------------------------

class BenchmarkItem(BaseModel):
    id: str
    query: str
    ground_truth_answer: str
    expected_doc_ids: List[str]
    expected_entities: List[str]
    category: str


class EvaluationResult(BaseModel):
    benchmark_id: str
    query: str
    precision_at_k: float
    recall_at_k: float
    mrr: float  # Mean Reciprocal Rank
    groundedness_score: float  # 0.0 to 1.0
    citation_precision: float  # fraction of citations that are relevant
    hallucination_detected: bool
    latency_ms: float
    predicted_answer: str
    ground_truth_answer: str


class AggregateEvaluationReport(BaseModel):
    total_queries: int
    mean_precision_at_k: float
    mean_recall_at_k: float
    mean_mrr: float
    mean_groundedness: float
    mean_citation_precision: float
    hallucination_rate: float
    average_latency_ms: float
    results: List[EvaluationResult] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
