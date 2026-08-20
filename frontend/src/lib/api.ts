import {
  AnswerResponse,
  RetrievalDebuggerTrace,
  GraphSubgraph,
  AggregateEvaluationReport,
  DocumentItem,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export async function submitQuery(
  query: string,
  options?: {
    use_vector?: boolean;
    use_bm25?: boolean;
    use_graph?: boolean;
    use_reranker?: boolean;
    top_k?: number;
  }
): Promise<AnswerResponse> {
  const res = await fetch(`${API_BASE}/query/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      use_vector: options?.use_vector ?? true,
      use_bm25: options?.use_bm25 ?? true,
      use_graph: options?.use_graph ?? true,
      use_reranker: options?.use_reranker ?? true,
      top_k: options?.top_k ?? 5,
    }),
  });
  if (!res.ok) {
    throw new Error(`Failed to query knowledge base: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchDebuggerTrace(query: string): Promise<RetrievalDebuggerTrace> {
  const res = await fetch(`${API_BASE}/debugger/trace`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, top_k: 5 }),
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch debug trace: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchKnowledgeGraph(): Promise<GraphSubgraph> {
  const res = await fetch(`${API_BASE}/graph/`);
  if (!res.ok) {
    throw new Error(`Failed to fetch knowledge graph: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchDocuments(): Promise<DocumentItem[]> {
  const res = await fetch(`${API_BASE}/documents/`);
  if (!res.ok) {
    throw new Error(`Failed to fetch documents: ${res.statusText}`);
  }
  return res.json();
}

export async function uploadDocument(formData: FormData): Promise<any> {
  const res = await fetch(`${API_BASE}/documents/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    throw new Error(`Failed to upload document: ${res.statusText}`);
  }
  return res.json();
}

export async function runEvaluation(): Promise<AggregateEvaluationReport> {
  const res = await fetch(`${API_BASE}/evaluation/run`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error(`Failed to run evaluation: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchSystemHealth(): Promise<any> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) {
    throw new Error(`Failed to fetch health: ${res.statusText}`);
  }
  return res.json();
}
