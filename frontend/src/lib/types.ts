export interface Citation {
  citation_id: number;
  source_tag: string;
  doc_id: string;
  chunk_id: string;
  file_name: string;
  source_type: string;
  section_heading?: string;
  service_name?: string;
  exact_quote_or_span?: string;
  confidence: number;
}

export interface ConfidenceIndicator {
  score: number;
  level: "HIGH" | "MEDIUM" | "LOW" | "UNRELIABLE";
  reasoning: string;
  is_sufficient_evidence: boolean;
  contradictions_found: string[];
}

export interface RetrievedChunk {
  chunk_id: string;
  doc_id: string;
  content: string;
  source_type: string;
  file_name: string;
  service_name?: string;
  section_heading?: string;
  score: number;
  retrieval_source: string;
  metadata?: Record<string, any>;
}

export interface VectorSearchResult {
  chunk_id: string;
  doc_id: string;
  content: string;
  similarity_score: number;
  rank: number;
  metadata?: Record<string, any>;
}

export interface BM25SearchResult {
  chunk_id: string;
  doc_id: string;
  content: string;
  bm25_score: number;
  rank: number;
  metadata?: Record<string, any>;
}

export interface GraphSearchResult {
  chunk_id?: string;
  doc_id?: string;
  entity_id: string;
  entity_label: string;
  entity_type: string;
  related_entities: Array<{ id: string; label: string; relation: string }>;
  relationship_path: string;
  relevance_score: number;
  rank: number;
}

export interface RRFResult {
  chunk_id: string;
  doc_id: string;
  content: string;
  vector_rank?: number;
  bm25_rank?: number;
  graph_rank?: number;
  rrf_score: number;
  metadata?: Record<string, any>;
}

export interface RetrievalDebuggerTrace {
  query: string;
  query_intent: string;
  extracted_entities: string[];
  vector_results: VectorSearchResult[];
  bm25_results: BM25SearchResult[];
  graph_results: GraphSearchResult[];
  fused_results: RRFResult[];
  reranked_results: RetrievedChunk[];
  total_retrieval_time_ms: number;
}

export interface AnswerResponse {
  query: string;
  direct_answer: string;
  detailed_explanation: string;
  evidence_summary: string;
  citations: Citation[];
  confidence: ConfidenceIndicator;
  related_services: string[];
  related_entities: string[];
  retrieved_sources: RetrievedChunk[];
  debug_trace?: RetrievalDebuggerTrace;
  latency_ms: number;
}

export interface GraphNode {
  id: string;
  label: string;
  entity_type: string;
  properties: Record<string, any>;
  doc_id?: string;
  chunk_id?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relation: string;
  properties: Record<string, any>;
  weight: number;
}

export interface GraphSubgraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface EvaluationResult {
  benchmark_id: string;
  query: string;
  precision_at_k: number;
  recall_at_k: number;
  mrr: number;
  groundedness_score: number;
  citation_precision: number;
  hallucination_detected: boolean;
  latency_ms: number;
  predicted_answer: string;
  ground_truth_answer: string;
}

export interface AggregateEvaluationReport {
  total_queries: number;
  mean_precision_at_k: number;
  mean_recall_at_k: number;
  mean_mrr: number;
  mean_groundedness: number;
  mean_citation_precision: number;
  hallucination_rate: number;
  average_latency_ms: number;
  results: EvaluationResult[];
  timestamp: string;
}

export interface DocumentItem {
  doc_id: string;
  title: string;
  source_type: string;
  file_name: string;
  service_name?: string;
  created_at: string;
}
