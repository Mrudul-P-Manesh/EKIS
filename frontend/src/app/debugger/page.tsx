"use client";

import { useState, useEffect } from "react";
import { fetchDebuggerTrace } from "@/lib/api";
import { RetrievalDebuggerTrace } from "@/lib/types";
import { 
  Cpu, 
  Search, 
  Layers, 
  Network, 
  Sparkles, 
  ListOrdered, 
  Clock, 
  CheckCircle2, 
  Zap,
  ChevronRight,
  Filter
} from "lucide-react";

export default function RetrievalDebugger() {
  const [query, setQuery] = useState("Why is the authentication service returning 401 errors after deployment?");
  const [loading, setLoading] = useState(false);
  const [trace, setTrace] = useState<RetrievalDebuggerTrace | null>(null);
  const [activeTab, setActiveTab] = useState<"fused" | "vector" | "bm25" | "graph" | "reranked">("fused");

  const runDebug = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await fetchDebuggerTrace(query);
      setTrace(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDebug();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <Cpu className="h-4 w-4" />
            <span>Observability & Pipeline Inspection</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Multi-Stage Retrieval Debugger
          </h1>
          <p className="text-sm text-slate-400">
            Inspect each stage of the retrieval funnel: Vector search, BM25 keywords, Knowledge Graph hops, RRF fusion, and Cross-Encoder reranking.
          </p>
        </div>
      </div>

      {/* Query Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter query to debug retrieval stages..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        <button
          onClick={runDebug}
          disabled={loading}
          className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold transition flex items-center justify-center space-x-2 shrink-0 shadow-lg shadow-blue-600/20"
        >
          {loading ? (
            <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <Zap className="h-4 w-4" />
          )}
          <span>Trace Pipeline</span>
        </button>
      </div>

      {/* Pipeline Summary Bar */}
      {trace && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="glass-panel p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block">Intent Classification</span>
            <span className="text-sm font-bold text-white uppercase tracking-wider">{trace.query_intent}</span>
          </div>
          <div className="glass-panel p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block">Vector Hits</span>
            <span className="text-base font-bold text-blue-400">{trace.vector_results.length} Chunks</span>
          </div>
          <div className="glass-panel p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block">Graph Entities</span>
            <span className="text-base font-bold text-indigo-400">{trace.graph_results.length} Matched</span>
          </div>
          <div className="glass-panel p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block">Retrieval Latency</span>
            <span className="text-base font-bold text-emerald-400">{trace.total_retrieval_time_ms} ms</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-800 flex space-x-2 overflow-x-auto">
        {[
          { id: "fused", label: "Reciprocal Rank Fusion (RRF)", count: trace?.fused_results.length },
          { id: "reranked", label: "Cross-Encoder Reranked", count: trace?.reranked_results.length },
          { id: "vector", label: "Dense Vector (Qdrant)", count: trace?.vector_results.length },
          { id: "bm25", label: "Keyword (BM25Okapi)", count: trace?.bm25_results.length },
          { id: "graph", label: "Knowledge Graph (Neo4j)", count: trace?.graph_results.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition whitespace-nowrap flex items-center space-x-2 ${
              activeTab === tab.id
                ? "border-blue-500 text-blue-400 bg-blue-500/10 rounded-t-lg"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-xs text-slate-300">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Active Tab Content */}
      <div className="space-y-4">
        {activeTab === "fused" && trace && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-500/20 text-xs text-blue-300">
              Reciprocal Rank Fusion (RRF) combines scores using formula: <code className="font-mono">RRF_Score = 1 / (60 + Rank)</code> across vector, BM25, and graph channels.
            </div>
            <div className="grid gap-3">
              {trace.fused_results.map((r, i) => (
                <div key={i} className="glass-panel p-5 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="px-2.5 py-1 rounded bg-blue-600/20 text-blue-400 text-xs font-bold font-mono">
                        RRF Rank #{i + 1}
                      </span>
                      <span className="text-xs text-slate-300 font-semibold">
                        {r.metadata?.file_name || r.doc_id}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 font-semibold">
                      Score: {r.rrf_score.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                    <span>Vector Rank: {r.vector_rank ? `#${r.vector_rank}` : "None"}</span>
                    <span>•</span>
                    <span>BM25 Rank: {r.bm25_rank ? `#${r.bm25_rank}` : "None"}</span>
                    <span>•</span>
                    <span>Graph Rank: {r.graph_rank ? `#${r.graph_rank}` : "None"}</span>
                  </div>
                  <p className="text-xs text-slate-300 font-mono bg-slate-950/60 p-3 rounded-lg border border-slate-900 whitespace-pre-wrap">
                    {r.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "reranked" && trace && (
          <div className="grid gap-3">
            {trace.reranked_results.map((r, i) => (
              <div key={i} className="glass-panel p-5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="px-2.5 py-1 rounded bg-emerald-600/20 text-emerald-400 text-xs font-bold font-mono">
                      Top #{i + 1}
                    </span>
                    <span className="text-xs font-semibold text-white">
                      {r.file_name}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-blue-400">
                    Relevance Score: {(r.score * 100).toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-mono bg-slate-950/60 p-3 rounded-lg border border-slate-900 whitespace-pre-wrap">
                  {r.content}
                </p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "vector" && trace && (
          <div className="grid gap-3">
            {trace.vector_results.map((r, i) => (
              <div key={i} className="glass-panel p-5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-400">Rank #{r.rank}</span>
                  <span className="text-xs font-mono text-slate-400">Cosine Similarity: {r.similarity_score.toFixed(4)}</span>
                </div>
                <p className="text-xs text-slate-300 font-mono bg-slate-950/60 p-3 rounded-lg border border-slate-900 whitespace-pre-wrap">
                  {r.content}
                </p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "bm25" && trace && (
          <div className="grid gap-3">
            {trace.bm25_results.map((r, i) => (
              <div key={i} className="glass-panel p-5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400">BM25 Rank #{r.rank}</span>
                  <span className="text-xs font-mono text-slate-400">Score: {r.bm25_score.toFixed(3)}</span>
                </div>
                <p className="text-xs text-slate-300 font-mono bg-slate-950/60 p-3 rounded-lg border border-slate-900 whitespace-pre-wrap">
                  {r.content}
                </p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "graph" && trace && (
          <div className="grid gap-3">
            {trace.graph_results.map((g, i) => (
              <div key={i} className="glass-panel p-5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 text-xs font-semibold">
                      {g.entity_type}
                    </span>
                    <span className="text-sm font-bold text-white">{g.entity_label}</span>
                  </div>
                  <span className="text-xs text-slate-400">Match Score: {g.relevance_score}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-indigo-300 font-mono">
                  {g.relationship_path}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
