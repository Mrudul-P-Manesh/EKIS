"use client";

import { useState } from "react";
import { submitQuery } from "@/lib/api";
import { AnswerResponse, Citation } from "@/lib/types";
import { CitationModal } from "@/components/CitationModal";
import { 
  Search, 
  ArrowRight, 
  CheckCircle2, 
  ShieldAlert, 
  SlidersHorizontal,
  Sparkles, 
  Clock, 
  Tag, 
  Layers, 
  FileText,
  AlertTriangle,
  Server,
  CornerDownLeft,
  ChevronDown
} from "lucide-react";

export default function QueryConsolePage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AnswerResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);

  // Search options
  const [showOptions, setShowOptions] = useState(false);
  const [useVector, setUseVector] = useState(true);
  const [useBm25, setUseBm25] = useState(true);
  const [useGraph, setUseGraph] = useState(true);
  const [useReranker, setUseReranker] = useState(true);
  const [topK, setTopK] = useState(5);

  const sampleQueries = [
    "Why is the authentication service returning 401 errors after deployment?",
    "What is the token expiration TTL and key rotation policy specified in ADR-004?",
    "What caused incident INC-401 and how was it mitigated?",
    "Who is the CEO of Tesla?"
  ];

  const handleSearch = async (queryText?: string) => {
    const q = queryText || query;
    if (!q.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await submitQuery(q, {
        use_vector: useVector,
        use_bm25: useBm25,
        use_graph: useGraph,
        use_reranker: useReranker,
        top_k: topK,
      });
      setResponse(res);
    } catch (err: any) {
      setError(err.message || "Failed to fetch response from backend.");
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceBadge = (confidence?: AnswerResponse["confidence"]) => {
    if (!confidence) return null;
    const scorePct = (confidence.score * 100).toFixed(0);

    if (confidence.level === "HIGH") {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950/70 text-emerald-400 border border-emerald-800/80">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span>High Confidence ({scorePct}%)</span>
        </span>
      );
    } else if (confidence.level === "MEDIUM") {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-950/70 text-amber-400 border border-amber-800/80">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          <span>Medium Confidence ({scorePct}%)</span>
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-950/70 text-red-400 border border-red-800/80">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
          <span>Insufficient Evidence (0%)</span>
        </span>
      );
    }
  };

  const renderTextWithCitations = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\[SOURCE-\d+\])/g);

    return parts.map((part, idx) => {
      const match = part.match(/\[SOURCE-(\d+)\]/);
      if (match) {
        const citId = parseInt(match[1], 10);
        const citObj = response?.citations.find((c) => c.citation_id === citId);

        return (
          <button
            key={idx}
            onClick={() => citObj && setSelectedCitation(citObj)}
            className="inline-flex items-center mx-1 px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono text-[11px] font-medium border border-zinc-700 transition"
            title={citObj ? `${citObj.file_name} - ${citObj.section_heading || ""}` : "Source Citation"}
          >
            {part}
          </button>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="space-y-1 text-center sm:text-left">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-100">
          Engineering Knowledge Search
        </h1>
        <p className="text-xs text-zinc-400">
          Grounded semantic intelligence across microservice docs, ADRs, runbooks, and source code.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="bg-[#111113] border border-zinc-800 rounded-xl p-2.5 shadow-lg focus-within:border-zinc-600 transition">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
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
            placeholder="Ask a technical architecture or incident question..."
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowOptions(!showOptions)}
            className={`p-1.5 rounded-lg border text-xs transition ${
              showOptions 
                ? "bg-zinc-800 border-zinc-600 text-zinc-200" 
                : "border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
            title="Retrieval Options"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </button>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-900 hover:bg-white text-xs font-semibold disabled:opacity-40 disabled:hover:bg-zinc-100 transition shadow-sm"
          >
            {loading ? (
              <span className="flex items-center space-x-1">
                <span className="animate-spin h-3 w-3 border-2 border-zinc-900 border-t-transparent rounded-full" />
                <span>Searching...</span>
              </span>
            ) : (
              <>
                <span>Search</span>
                <CornerDownLeft className="h-3 w-3 text-zinc-600" />
              </>
            )}
          </button>
        </form>

        {/* Options Tray */}
        {showOptions && (
          <div className="mt-3 pt-3 border-t border-zinc-800/80 px-2 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-300">
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useVector}
                  onChange={(e) => setUseVector(e.target.checked)}
                  className="rounded bg-zinc-900 border-zinc-700 text-zinc-100 focus:ring-0"
                />
                <span>Vector Search</span>
              </label>
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useBm25}
                  onChange={(e) => setUseBm25(e.target.checked)}
                  className="rounded bg-zinc-900 border-zinc-700 text-zinc-100 focus:ring-0"
                />
                <span>BM25 Keywords</span>
              </label>
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useGraph}
                  onChange={(e) => setUseGraph(e.target.checked)}
                  className="rounded bg-zinc-900 border-zinc-700 text-zinc-100 focus:ring-0"
                />
                <span>Neo4j Graph</span>
              </label>
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useReranker}
                  onChange={(e) => setUseReranker(e.target.checked)}
                  className="rounded bg-zinc-900 border-zinc-700 text-zinc-100 focus:ring-0"
                />
                <span>Reranker</span>
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-zinc-500">Top-K:</span>
              <select
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                className="bg-zinc-900 border border-zinc-700 rounded px-2 py-0.5 text-xs text-zinc-200"
              >
                <option value={3}>3</option>
                <option value={5}>5</option>
                <option value={8}>8</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Suggestion Prompts */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
          Suggested queries
        </span>
        <div className="flex flex-wrap gap-1.5">
          {sampleQueries.map((sq, i) => (
            <button
              key={i}
              onClick={() => {
                setQuery(sq);
                handleSearch(sq);
              }}
              className="text-left px-2.5 py-1 rounded-md bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 hover:text-zinc-100 transition"
            >
              {sq}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-lg bg-red-950/40 border border-red-900/80 text-red-300 text-xs flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Result Section */}
      {response && (
        <div className="space-y-4 pt-2 animate-in fade-in duration-200">
          {/* Metadata bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="flex items-center space-x-2">
              {getConfidenceBadge(response.confidence)}
              <span className="text-xs text-zinc-500 font-mono">
                {response.latency_ms} ms
              </span>
            </div>
            <div className="text-xs text-zinc-400 font-mono">
              {response.citations.length} Citations
            </div>
          </div>

          {/* Direct Resolution Panel */}
          <div className="bg-[#111113] border border-zinc-800 rounded-xl p-5 space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Resolution
            </h2>
            <div className="text-sm text-zinc-100 leading-relaxed font-medium">
              {renderTextWithCitations(response.direct_answer)}
            </div>
          </div>

          {/* Detailed Breakdown */}
          {response.detailed_explanation && (
            <div className="bg-[#111113] border border-zinc-800 rounded-xl p-5 space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Detailed Analysis
              </h2>
              <div className="text-xs text-zinc-300 leading-relaxed space-y-2">
                {renderTextWithCitations(response.detailed_explanation)}
              </div>
            </div>
          )}

          {/* Evidence Summary & Tags */}
          {(response.evidence_summary || response.related_services.length > 0) && (
            <div className="bg-[#111113] border border-zinc-800 rounded-xl p-4 space-y-3">
              {response.evidence_summary && (
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Evidence Synthesis
                  </span>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {renderTextWithCitations(response.evidence_summary)}
                  </p>
                </div>
              )}

              {(response.related_services.length > 0 || response.related_entities.length > 0) && (
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-zinc-800/80">
                  {response.related_services.map((svc, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800 text-[11px] font-mono"
                    >
                      svc:{svc}
                    </span>
                  ))}
                  {response.related_entities.map((ent, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 text-[11px] font-mono"
                    >
                      ent:{ent}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Verified Source Citations */}
          {response.citations.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 px-1">
                Verified Citations
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {response.citations.map((cit) => (
                  <div
                    key={cit.citation_id}
                    onClick={() => setSelectedCitation(cit)}
                    className="p-3 rounded-lg bg-[#111113] border border-zinc-800 hover:border-zinc-600 cursor-pointer transition space-y-1.5 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 font-mono text-[11px] font-semibold border border-zinc-700">
                        {cit.source_tag}
                      </span>
                      <span className="text-[10px] text-zinc-500 uppercase font-mono">
                        {cit.source_type}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-zinc-200 truncate group-hover:text-white transition">
                      {cit.file_name}
                    </div>
                    {cit.section_heading && (
                      <div className="text-[11px] text-zinc-500 truncate">
                        {cit.section_heading}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Citation Modal */}
      <CitationModal
        citation={selectedCitation}
        onClose={() => setSelectedCitation(null)}
      />
    </div>
  );
}
