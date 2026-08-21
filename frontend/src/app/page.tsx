"use client";

import { useState, useEffect } from "react";
import { submitQuery } from "@/lib/api";
import { AnswerResponse, Citation } from "@/lib/types";
import { CitationModal } from "@/components/CitationModal";
import { PipelineVisualizer } from "@/components/PipelineVisualizer";
import GradientWaves from "@/components/GradientWaves";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  SlidersHorizontal,
  Sparkles, 
  Clock, 
  Tag, 
  Layers, 
  FileText,
  AlertTriangle,
  Server,
  CornerDownLeft,
  Copy,
  Check,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Database
} from "lucide-react";
import Link from "next/link";

export default function QueryConsolePage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [response, setResponse] = useState<AnswerResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [copied, setCopied] = useState(false);

  // Search options
  const [showOptions, setShowOptions] = useState(false);
  const [useVector, setUseVector] = useState(true);
  const [useBm25, setUseBm25] = useState(true);
  const [useGraph, setUseGraph] = useState(true);
  const [useReranker, setUseReranker] = useState(true);
  const [topK, setTopK] = useState(5);
  const [filterService, setFilterService] = useState("");

  const [recentQueries, setRecentQueries] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ekis_recent_queries");
      if (saved) setRecentQueries(JSON.parse(saved));
    } catch {}
  }, []);

  const saveRecentQuery = (q: string) => {
    try {
      const updated = [q, ...recentQueries.filter((item) => item !== q)].slice(0, 6);
      setRecentQueries(updated);
      localStorage.setItem("ekis_recent_queries", JSON.stringify(updated));
    } catch {}
  };

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
    setActiveStep(0);
    saveRecentQuery(q);

    // Simulate animated pipeline step progression
    const stepInterval = setInterval(() => {
      setActiveStep((prev) => (prev < 4 ? prev + 1 : prev));
    }, 180);

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
      clearInterval(stepInterval);
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!response) return;
    navigator.clipboard.writeText(`${response.direct_answer}\n\n${response.detailed_explanation}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getConfidenceBadge = (confidence?: AnswerResponse["confidence"]) => {
    if (!confidence) return null;
    const scorePct = (confidence.score * 100).toFixed(0);

    if (confidence.level === "HIGH") {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950/70 text-emerald-400 border border-emerald-800/80">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span>High Grounding ({scorePct}%)</span>
        </span>
      );
    } else if (confidence.level === "MEDIUM") {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-950/70 text-amber-400 border border-amber-800/80">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          <span>Moderate ({scorePct}%)</span>
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
            className="inline-flex items-center mx-1 px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono text-[11px] font-medium border border-zinc-700 hover:border-zinc-500 transition shadow-sm"
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Console Header */}
      <div className="pt-2 pb-1 space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center space-x-2 drop-shadow-sm">
          <span>Engineering Intelligence Console</span>
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 font-medium">
          Grounded multi-modal RAG across microservice architecture, ADRs, postmortems, and code.
        </p>
      </div>

      {/* Interactive Search Input Box */}
      <div className="bg-[#111113]/90 backdrop-blur-md border border-zinc-800 rounded-2xl p-3 shadow-2xl focus-within:border-zinc-600 transition">
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
            placeholder="Ask a technical architecture, error cause, or incident question..."
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
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-100 text-zinc-900 hover:bg-white text-xs font-semibold disabled:opacity-40 transition shadow-sm"
          >
            {loading ? (
              <span className="flex items-center space-x-1.5">
                <span className="animate-spin h-3 w-3 border-2 border-zinc-900 border-t-transparent rounded-full" />
                <span>Running Pipeline...</span>
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
        <AnimatePresence>
          {showOptions && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-zinc-800/80 px-2 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-300">
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useVector}
                      onChange={(e) => setUseVector(e.target.checked)}
                      className="rounded bg-zinc-900 border-zinc-700 text-zinc-100 focus:ring-0"
                    />
                    <span>Vector (Qdrant)</span>
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
                    <span>Cross-Encoder Reranker</span>
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Suggested & Recent Prompts */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider font-mono">
            Suggested Engineering Queries
          </span>
          <span className="text-[11px] text-zinc-500 font-mono">
            Press <kbd className="px-1 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400">⌘K</kbd> for palette
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {sampleQueries.map((sq, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => {
                setQuery(sq);
                handleSearch(sq);
              }}
              className="text-left px-2.5 py-1 rounded-lg bg-[#111113] hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 hover:text-zinc-100 transition shadow-sm flex items-center space-x-1.5"
            >
              <Sparkles className="h-3 w-3 text-blue-400 shrink-0" />
              <span className="truncate">{sq}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Live AI/RAG Pipeline Execution Visualizer */}
      <PipelineVisualizer
        isLoading={loading}
        activeStep={activeStep}
        stats={
          response
            ? {
                vectorHits: response.debug_trace?.vector_results.length || 0,
                graphHits: response.debug_trace?.graph_results.length || 0,
                fusedCount: response.debug_trace?.fused_results.length || 0,
                rerankCount: response.retrieved_sources.length || 0,
                confidenceScore: response.confidence.score,
                latencyMs: response.latency_ms,
              }
            : undefined
        }
      />

      {/* Error Banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-xl bg-red-950/40 border border-red-900 text-red-300 text-xs flex items-center space-x-2.5"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* Grounded Result Display */}
      {response && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-4 pt-2"
        >
          {/* Metadata & Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="flex items-center space-x-2.5">
              {getConfidenceBadge(response.confidence)}
              <span className="text-xs text-zinc-500 font-mono">
                {response.latency_ms} ms
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 transition"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
              <Link
                href={`/debugger`}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 transition"
              >
                <Layers className="h-3 w-3" />
                <span>Debug Funnel</span>
              </Link>
            </div>
          </div>

          {/* Direct Resolution Panel */}
          <div className="bg-[#111113] border border-zinc-800 rounded-xl p-5 space-y-2.5 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">
                Direct Resolution
              </h2>
              <span className="text-[11px] text-zinc-500 font-mono">
                {response.citations.length} Grounded Citations
              </span>
            </div>
            <div className="text-sm text-zinc-100 leading-relaxed font-medium">
              {renderTextWithCitations(response.direct_answer)}
            </div>
          </div>

          {/* Detailed Breakdown */}
          {response.detailed_explanation && (
            <div className="bg-[#111113] border border-zinc-800 rounded-xl p-5 space-y-2.5 shadow-lg">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">
                Architecture Breakdown & Analysis
              </h2>
              <div className="text-xs text-zinc-300 leading-relaxed space-y-2">
                {renderTextWithCitations(response.detailed_explanation)}
              </div>
            </div>
          )}

          {/* Evidence Summary & Tags */}
          {(response.evidence_summary || response.related_services.length > 0) && (
            <div className="bg-[#111113] border border-zinc-800 rounded-xl p-4 space-y-3 shadow-lg">
              {response.evidence_summary && (
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
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
                      className="px-2 py-0.5 rounded bg-zinc-950 text-blue-400 border border-zinc-800 text-[11px] font-mono"
                    >
                      svc:{svc}
                    </span>
                  ))}
                  {response.related_entities.map((ent, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-zinc-950 text-purple-400 border border-zinc-800 text-[11px] font-mono"
                    >
                      ent:{ent}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Verified Source Citations Cards */}
          {response.citations.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 px-1 font-mono">
                Verified Source Citations
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {response.citations.map((cit) => (
                  <motion.div
                    key={cit.citation_id}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedCitation(cit)}
                    className="p-3.5 rounded-xl bg-[#111113] border border-zinc-800 hover:border-zinc-600 cursor-pointer transition space-y-1.5 shadow-md group"
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
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Citation Modal */}
      <CitationModal
        citation={selectedCitation}
        onClose={() => setSelectedCitation(null)}
      />
    </div>
  );
}
