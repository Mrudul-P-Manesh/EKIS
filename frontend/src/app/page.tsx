"use client";

import { useState } from "react";
import { submitQuery } from "@/lib/api";
import { AnswerResponse, Citation } from "@/lib/types";
import { CitationModal } from "@/components/CitationModal";
import { 
  Search, 
  Sparkles, 
  ShieldCheck, 
  ShieldAlert, 
  AlertCircle, 
  CheckCircle2, 
  Layers, 
  Network, 
  Sliders, 
  Clock, 
  ExternalLink,
  ChevronRight,
  BookOpen
} from "lucide-react";

export default function QueryConsole() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<AnswerResponse | null>(null);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);

  // Advanced toggles
  const [useVector, setUseVector] = useState(true);
  const [useBM25, setUseBM25] = useState(true);
  const [useGraph, setUseGraph] = useState(true);
  const [useReranker, setUseReranker] = useState(true);
  const [showOptions, setShowOptions] = useState(false);

  const sampleQueries = [
    "Why is the authentication service returning 401 errors after deployment?",
    "What is the token expiration TTL and key rotation policy specified in ADR-004?",
    "How should engineers mitigate an unauthorized token verification loop in the API gateway?",
  ];

  const handleSearch = async (queryText?: string) => {
    const q = queryText || query;
    if (!q.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await submitQuery(q, {
        use_vector: useVector,
        use_bm25: useBM25,
        use_graph: useGraph,
        use_reranker: useReranker,
        top_k: 5,
      });
      setResponse(res);
    } catch (err: any) {
      setError(err.message || "Failed to retrieve grounded answer.");
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceBadge = (level: string) => {
    switch (level) {
      case "HIGH":
        return {
          bg: "bg-emerald-950/60 border-emerald-500/40 text-emerald-400",
          icon: ShieldCheck,
          label: "High Confidence Grounded",
        };
      case "MEDIUM":
        return {
          bg: "bg-blue-950/60 border-blue-500/40 text-blue-400",
          icon: CheckCircle2,
          label: "Medium Confidence",
        };
      case "LOW":
        return {
          bg: "bg-amber-950/60 border-amber-500/40 text-amber-400",
          icon: AlertCircle,
          label: "Low Confidence - Partial Evidence",
        };
      default:
        return {
          bg: "bg-red-950/60 border-red-500/40 text-red-400",
          icon: ShieldAlert,
          label: "Unreliable - Evidence Insufficient",
        };
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-950/50 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Grounded Engineering Intelligence</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Ask Your Engineering Knowledge Base
        </h1>
        <p className="text-sm sm:text-base text-slate-400">
          Synthesizes verified technical insights from microservice documentation, Architecture Decision Records (ADRs), code repositories, and operational postmortems.
        </p>
      </div>

      {/* Query Bar */}
      <div className="max-w-3xl mx-auto">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="relative flex items-center"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Why is the authentication service returning 401 errors after deployment?"
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 shadow-xl transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="ml-3 px-6 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-sm sm:text-base shadow-lg shadow-blue-600/30 transition flex items-center space-x-2 shrink-0"
          >
            {loading ? (
              <span className="flex items-center space-x-2">
                <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Synthesizing...</span>
              </span>
            ) : (
              <span>Ask EKIS</span>
            )}
          </button>
        </form>

        {/* Quick Question Chips */}
        <div className="mt-3 flex items-center justify-between text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 font-medium">Try:</span>
            {sampleQueries.map((q, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(q);
                  handleSearch(q);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/60 transition truncate max-w-xs"
              >
                {q}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="flex items-center space-x-1 text-slate-400 hover:text-blue-400 transition"
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Options</span>
          </button>
        </div>

        {/* Advanced Retrieval Controls */}
        {showOptions && (
          <div className="mt-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap gap-4 text-xs">
            <label className="flex items-center space-x-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={useVector}
                onChange={(e) => setUseVector(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500"
              />
              <span>Vector Search (Qdrant)</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={useBM25}
                onChange={(e) => setUseBM25(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500"
              />
              <span>BM25 Keywords</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={useGraph}
                onChange={(e) => setUseGraph(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500"
              />
              <span>Knowledge Graph (Neo4j)</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={useReranker}
                onChange={(e) => setUseReranker(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500"
              />
              <span>Cross-Encoder Reranker</span>
            </label>
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="max-w-3xl mx-auto p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-sm flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grounded Response View */}
      {response && (
        <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          {/* Main Answer Card */}
          <div className="glass-panel p-6 sm:p-8 rounded-2xl shadow-2xl border border-slate-700/80 space-y-6">
            {/* Confidence & Latency Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
              {(() => {
                const conf = getConfidenceBadge(response.confidence.level);
                const Icon = conf.icon;
                return (
                  <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${conf.bg}`}>
                    <Icon className="h-4 w-4" />
                    <span>{conf.label} ({(response.confidence.score * 100).toFixed(0)}%)</span>
                  </div>
                );
              })()}

              <div className="flex items-center space-x-4 text-xs text-slate-400">
                <span className="flex items-center space-x-1">
                  <Clock className="h-3.5 w-3.5 text-slate-500" />
                  <span>{response.latency_ms} ms</span>
                </span>
                <span className="flex items-center space-x-1">
                  <BookOpen className="h-3.5 w-3.5 text-slate-500" />
                  <span>{response.citations.length} Grounded Citations</span>
                </span>
              </div>
            </div>

            {/* Direct Answer */}
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-blue-400">
                Direct Resolution
              </h2>
              <p className="text-base sm:text-lg text-white font-medium leading-relaxed">
                {response.direct_answer}
              </p>
            </div>

            {/* Detailed Technical Explanation */}
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Architecture Breakdown & Analysis
              </h3>
              <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap space-y-2">
                {response.detailed_explanation}
              </div>
            </div>

            {/* Evidence Summary */}
            {response.evidence_summary && (
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5 text-xs text-slate-300">
                <span className="font-bold text-slate-400 uppercase tracking-wider">Evidence Summary:</span>
                <p>{response.evidence_summary}</p>
              </div>
            )}

            {/* Citations Row */}
            {response.citations.length > 0 && (
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Verified Source Citations
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {response.citations.map((c) => (
                    <button
                      key={c.citation_id}
                      onClick={() => setSelectedCitation(c)}
                      className="text-left p-3 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-blue-500/40 transition flex items-start space-x-3 group"
                    >
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono text-xs font-bold shrink-0">
                        {c.source_tag}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate group-hover:text-blue-300 transition">
                          {c.file_name}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {c.section_heading || c.source_type}
                        </p>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-slate-500 group-hover:text-blue-400 shrink-0 transition" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Related Services & Graph Entities */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800/80 text-xs">
              {response.related_services.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-slate-400">Services:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {response.related_services.map((srv, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-500/30">
                        {srv}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {response.related_entities.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-slate-400">Entities:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {response.related_entities.map((ent, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {ent}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Citation Details Modal */}
      <CitationModal
        citation={selectedCitation}
        onClose={() => setSelectedCitation(null)}
      />
    </div>
  );
}
