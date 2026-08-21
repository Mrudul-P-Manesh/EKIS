"use client";

import { useState, useEffect } from "react";
import { fetchDebuggerTrace } from "@/lib/api";
import { RetrievalDebuggerTrace } from "@/lib/types";
import { 
  Search, 
  Clock, 
  Layers, 
  Database, 
  Sparkles, 
  Network, 
  FileText,
  CornerDownLeft
} from "lucide-react";

export default function RetrievalDebugger() {
  const [query, setQuery] = useState("Why is the authentication service returning 401 errors after deployment?");
  const [loading, setLoading] = useState(false);
  const [trace, setTrace] = useState<RetrievalDebuggerTrace | null>(null);
  const [activeTab, setActiveTab] = useState<"reranked" | "fused" | "vector" | "bm25" | "graph">("reranked");

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
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-100">
          Retrieval Funnel Debugger
        </h1>
        <p className="text-xs text-zinc-400">
          Inspect candidate rankings across Vector search, BM25 keyword matching, Knowledge Graph lookups, RRF fusion, and Cross-Encoder reranking.
        </p>
      </div>

      {/* Query Bar */}
      <div className="bg-[#111113] border border-zinc-800 rounded-xl p-2.5 shadow-lg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runDebug();
          }}
          className="flex items-center space-x-2"
        >
          <div className="pl-2 text-zinc-500">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search query to trace through retrieval pipeline..."
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-900 hover:bg-white text-xs font-semibold disabled:opacity-40 transition"
          >
            {loading ? (
              <span className="flex items-center space-x-1">
                <span className="animate-spin h-3 w-3 border-2 border-zinc-900 border-t-transparent rounded-full" />
                <span>Tracing...</span>
              </span>
            ) : (
              <>
                <span>Trace Funnel</span>
                <CornerDownLeft className="h-3 w-3 text-zinc-600" />
              </>
            )}
          </button>
        </form>
      </div>

      {trace && (
        <div className="space-y-6">
          {/* Latency & Stage Breakdown Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-[#111113] border border-zinc-800">
              <div className="text-zinc-500 text-[10px] uppercase font-mono">Vector Search</div>
              <div className="text-zinc-200 font-semibold font-mono text-sm">{trace.vector_results.length} Candidates</div>
            </div>
            <div className="p-2.5 rounded-lg bg-[#111113] border border-zinc-800">
              <div className="text-zinc-500 text-[10px] uppercase font-mono">BM25 Keywords</div>
              <div className="text-zinc-200 font-semibold font-mono text-sm">{trace.bm25_results.length} Candidates</div>
            </div>
            <div className="p-2.5 rounded-lg bg-[#111113] border border-zinc-800">
              <div className="text-zinc-500 text-[10px] uppercase font-mono">Knowledge Graph</div>
              <div className="text-zinc-200 font-semibold font-mono text-sm">{trace.graph_results.length} Entities</div>
            </div>
            <div className="p-2.5 rounded-lg bg-[#111113] border border-zinc-800">
              <div className="text-zinc-500 text-[10px] uppercase font-mono">RRF Fused</div>
              <div className="text-zinc-200 font-semibold font-mono text-sm">{trace.fused_results.length} Chunks</div>
            </div>
            <div className="p-2.5 rounded-lg bg-[#111113] border border-zinc-800 col-span-2 sm:col-span-1">
              <div className="text-zinc-500 text-[10px] uppercase font-mono">Total Retrieval</div>
              <div className="text-emerald-400 font-semibold font-mono text-sm">{trace.total_retrieval_time_ms.toFixed(1)} ms</div>
            </div>
          </div>

          {/* Segmented Tab Controls */}
          <div className="flex border-b border-zinc-800 space-x-1">
            {[
              { id: "reranked", label: `Reranked (${trace.reranked_results.length})` },
              { id: "fused", label: `RRF Fusion (${trace.fused_results.length})` },
              { id: "vector", label: `Vector (${trace.vector_results.length})` },
              { id: "bm25", label: `BM25 (${trace.bm25_results.length})` },
              { id: "graph", label: `Graph Entities (${trace.graph_results.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-2 text-xs font-medium border-b-2 transition ${
                  activeTab === tab.id
                    ? "border-zinc-100 text-zinc-100"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="space-y-3">
            {/* Reranked View */}
            {activeTab === "reranked" && (
              <div className="space-y-3">
                {trace.reranked_results.length === 0 ? (
                  <div className="p-6 text-center text-xs text-zinc-500 bg-[#111113] border border-zinc-800 rounded-xl">
                    No reranked candidates met the relevance threshold.
                  </div>
                ) : (
                  trace.reranked_results.map((item, idx) => (
                    <div key={idx} className="bg-[#111113] border border-zinc-800 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 text-xs font-mono font-semibold border border-zinc-700">
                            #{idx + 1}
                          </span>
                          <span className="text-xs font-medium text-zinc-200">
                            {item.file_name}
                          </span>
                          {item.section_heading && (
                            <span className="text-xs text-zinc-500 truncate max-w-xs">
                              {item.section_heading}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] text-zinc-400 font-mono">
                            Relevance: {(item.score * 100).toFixed(1)}%
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 text-[10px] uppercase font-mono">
                            {item.source_type}
                          </span>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80 text-zinc-300 text-xs font-mono whitespace-pre-wrap leading-relaxed">
                        {item.content}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* RRF Fused View */}
            {activeTab === "fused" && (
              <div className="space-y-3">
                {trace.fused_results.map((item, idx) => (
                  <div key={idx} className="bg-[#111113] border border-zinc-800 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 text-xs font-mono font-semibold border border-zinc-700">
                          Rank #{idx + 1}
                        </span>
                        <span className="text-xs font-medium text-zinc-200">
                          {item.metadata?.file_name || "Document Chunk"}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400 font-mono">
                        RRF Score: {item.rrf_score.toFixed(4)}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80 text-zinc-300 text-xs font-mono whitespace-pre-wrap leading-relaxed">
                      {item.content}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Vector View */}
            {activeTab === "vector" && (
              <div className="space-y-3">
                {trace.vector_results.map((item, idx) => (
                  <div key={idx} className="bg-[#111113] border border-zinc-800 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-200">
                        {item.metadata?.file_name || "Vector Chunk"}
                      </span>
                      <span className="text-xs text-zinc-400 font-mono">
                        Score: {item.similarity_score.toFixed(4)}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80 text-zinc-300 text-xs font-mono whitespace-pre-wrap leading-relaxed">
                      {item.content}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* BM25 View */}
            {activeTab === "bm25" && (
              <div className="space-y-3">
                {trace.bm25_results.map((item, idx) => (
                  <div key={idx} className="bg-[#111113] border border-zinc-800 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-200">
                        {item.metadata?.file_name || "BM25 Chunk"}
                      </span>
                      <span className="text-xs text-zinc-400 font-mono">
                        Score: {item.bm25_score.toFixed(2)}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80 text-zinc-300 text-xs font-mono whitespace-pre-wrap leading-relaxed">
                      {item.content}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Graph View */}
            {activeTab === "graph" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {trace.graph_results.length === 0 ? (
                  <div className="col-span-2 p-6 text-center text-xs text-zinc-500 bg-[#111113] border border-zinc-800 rounded-xl">
                    No knowledge graph entities matched query terms.
                  </div>
                ) : (
                  trace.graph_results.map((node, idx) => (
                    <div key={idx} className="bg-[#111113] border border-zinc-800 rounded-xl p-3.5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-100">
                          {node.entity_label || node.entity_id}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 text-[10px] font-mono">
                          {node.entity_type}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono">
                        Related: {node.related_entities.length} connections
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
