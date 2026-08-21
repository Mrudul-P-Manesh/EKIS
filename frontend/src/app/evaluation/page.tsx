"use client";

import { useState, useEffect } from "react";
import { runEvaluation } from "@/lib/api";
import { AggregateEvaluationReport, EvaluationResult } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  Activity,
  RefreshCw,
  ShieldCheck,
  Zap,
  Target,
  ChevronDown,
  ChevronUp,
  FileCheck
} from "lucide-react";

export default function EvaluationDashboard() {
  const [report, setReport] = useState<AggregateEvaluationReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const executeEvaluation = async () => {
    setLoading(true);
    try {
      const data = await runEvaluation();
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeEvaluation();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-100 flex items-center space-x-2">
            <span>RAG Evaluation & Quality Assurance</span>
          </h1>
          <p className="text-xs text-zinc-400">
            Continuous automated benchmarking for Precision@k, Recall@k, Mean Reciprocal Rank (MRR), Citation Precision, and Groundedness.
          </p>
        </div>

        <button
          onClick={executeEvaluation}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-100 text-zinc-900 hover:bg-white font-semibold text-xs disabled:opacity-50 transition self-start sm:self-auto shadow-sm"
        >
          {loading ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span>Running Benchmarks...</span>
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Run Benchmark Suite</span>
            </>
          )}
        </button>
      </div>

      {report && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-6"
        >
          {/* KPI Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#111113] border border-zinc-800 space-y-1 shadow-md">
              <div className="text-zinc-500 text-[10px] uppercase font-mono">Precision@k</div>
              <div className="text-xl font-bold text-zinc-100 font-mono">
                {(report.mean_precision_at_k * 100).toFixed(1)}%
              </div>
              <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-zinc-800">
                <motion.div 
                  className="bg-blue-500 h-full rounded-full" 
                  initial={{ width: 0 }}
                  animate={{ width: `${report.mean_precision_at_k * 100}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#111113] border border-zinc-800 space-y-1 shadow-md">
              <div className="text-zinc-500 text-[10px] uppercase font-mono">Recall@k</div>
              <div className="text-xl font-bold text-zinc-100 font-mono">
                {(report.mean_recall_at_k * 100).toFixed(1)}%
              </div>
              <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-zinc-800">
                <motion.div 
                  className="bg-indigo-500 h-full rounded-full" 
                  initial={{ width: 0 }}
                  animate={{ width: `${report.mean_recall_at_k * 100}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#111113] border border-zinc-800 space-y-1 shadow-md">
              <div className="text-zinc-500 text-[10px] uppercase font-mono">MRR Score</div>
              <div className="text-xl font-bold text-zinc-100 font-mono">
                {report.mean_mrr.toFixed(3)}
              </div>
              <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-zinc-800">
                <motion.div 
                  className="bg-purple-500 h-full rounded-full" 
                  initial={{ width: 0 }}
                  animate={{ width: `${report.mean_mrr * 100}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#111113] border border-zinc-800 space-y-1 shadow-md">
              <div className="text-zinc-500 text-[10px] uppercase font-mono">Groundedness</div>
              <div className="text-xl font-bold text-emerald-400 font-mono">
                {(report.mean_groundedness * 100).toFixed(1)}%
              </div>
              <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-zinc-800">
                <motion.div 
                  className="bg-emerald-500 h-full rounded-full" 
                  initial={{ width: 0 }}
                  animate={{ width: `${report.mean_groundedness * 100}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#111113] border border-zinc-800 space-y-1 shadow-md">
              <div className="text-zinc-500 text-[10px] uppercase font-mono">Citation Prec.</div>
              <div className="text-xl font-bold text-zinc-100 font-mono">
                {(report.mean_citation_precision * 100).toFixed(1)}%
              </div>
              <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-zinc-800">
                <motion.div 
                  className="bg-cyan-500 h-full rounded-full" 
                  initial={{ width: 0 }}
                  animate={{ width: `${report.mean_citation_precision * 100}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#111113] border border-zinc-800 space-y-1 shadow-md">
              <div className="text-zinc-500 text-[10px] uppercase font-mono">Hallucination</div>
              <div className="text-xl font-bold text-zinc-300 font-mono">
                {(report.hallucination_rate * 100).toFixed(1)}%
              </div>
              <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-zinc-800">
                <motion.div 
                  className="bg-red-500 h-full rounded-full" 
                  initial={{ width: 0 }}
                  animate={{ width: `${report.hallucination_rate * 100}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>
          </div>

          {/* Test Case Breakdown Table */}
          <div className="bg-[#111113] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">
                Benchmark Queries Evaluation ({report.results.length})
              </h2>
              <span className="text-[11px] text-zinc-500 font-mono">
                Avg Latency: <strong className="text-zinc-200">{report.average_latency_ms.toFixed(1)} ms</strong>
              </span>
            </div>

            <div className="divide-y divide-zinc-800/60">
              {report.results.map((item, idx) => {
                const isExpanded = expandedIndex === idx;
                return (
                  <div key={idx} className="p-4 hover:bg-zinc-900/40 transition space-y-3">
                    <div
                      onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="space-y-1 pr-4">
                        <div className="text-xs font-semibold text-zinc-100 flex items-center space-x-2">
                          <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px]">
                            #{idx + 1}
                          </span>
                          <span>{item.query}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 shrink-0 text-xs font-mono">
                        <span className="text-zinc-400">P@k: <strong className="text-zinc-200">{(item.precision_at_k * 100).toFixed(0)}%</strong></span>
                        <span className="text-zinc-400">R@k: <strong className="text-zinc-200">{(item.recall_at_k * 100).toFixed(0)}%</strong></span>
                        <span className="text-emerald-400">Grounded: {(item.groundedness_score * 100).toFixed(0)}%</span>
                        <span className="text-zinc-500">{item.latency_ms.toFixed(1)} ms</span>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
                      </div>
                    </div>

                    {/* Expandable Drilldown */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="pt-3 border-t border-zinc-800/80 space-y-2.5 text-xs font-mono"
                        >
                          <div className="space-y-1">
                            <span className="text-zinc-500 text-[11px]">PREDICTED GROUNDED ANSWER:</span>
                            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-[11px] leading-relaxed">
                              {item.predicted_answer}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-zinc-500 text-[11px]">GROUND TRUTH SPECIFICATION:</span>
                            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 text-[11px] leading-relaxed">
                              {item.ground_truth_answer}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
