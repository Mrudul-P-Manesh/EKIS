"use client";

import { useState, useEffect } from "react";
import { runEvaluation } from "@/lib/api";
import { AggregateEvaluationReport } from "@/lib/types";
import { 
  BarChart3, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  ShieldCheck, 
  Clock, 
  Target, 
  Sparkles,
  RefreshCw
} from "lucide-react";

export default function EvaluationDashboard() {
  const [report, setReport] = useState<AggregateEvaluationReport | null>(null);
  const [loading, setLoading] = useState(false);

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
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <BarChart3 className="h-4 w-4" />
            <span>RAG Benchmarking & Quality Assurance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Retrieval & Grounding Evaluation Suite
          </h1>
          <p className="text-sm text-slate-400">
            Measures precision, recall@k, mean reciprocal rank (MRR), citation precision, hallucination rate, and answer groundedness.
          </p>
        </div>

        <button
          onClick={executeEvaluation}
          disabled={loading}
          className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center space-x-2 shrink-0 shadow-lg shadow-emerald-600/20"
        >
          {loading ? (
            <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <Play className="h-4 w-4 fill-white" />
          )}
          <span>{loading ? "Evaluating Benchmark..." : "Run Benchmark Evaluation"}</span>
        </button>
      </div>

      {/* Aggregate Scorecards */}
      {report && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 block flex items-center space-x-1">
              <Target className="h-3.5 w-3.5 text-blue-400" />
              <span>Precision@5</span>
            </span>
            <span className="text-2xl font-black text-white">
              {(report.mean_precision_at_k * 100).toFixed(0)}%
            </span>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 block flex items-center space-x-1">
              <TrendingUp className="h-3.5 w-3.5 text-indigo-400" />
              <span>Recall@5</span>
            </span>
            <span className="text-2xl font-black text-white">
              {(report.mean_recall_at_k * 100).toFixed(0)}%
            </span>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 block flex items-center space-x-1">
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              <span>MRR</span>
            </span>
            <span className="text-2xl font-black text-purple-400">
              {report.mean_mrr.toFixed(2)}
            </span>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 block flex items-center space-x-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Groundedness</span>
            </span>
            <span className="text-2xl font-black text-emerald-400">
              {(report.mean_groundedness * 100).toFixed(0)}%
            </span>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 block flex items-center space-x-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
              <span>Citation Prec.</span>
            </span>
            <span className="text-2xl font-black text-cyan-400">
              {(report.mean_citation_precision * 100).toFixed(0)}%
            </span>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 block flex items-center space-x-1">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
              <span>Hallucination</span>
            </span>
            <span className={`text-2xl font-black ${report.hallucination_rate === 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {(report.hallucination_rate * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      )}

      {/* Query-by-Query Evaluation Breakdown */}
      {report && (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden space-y-4 p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            Benchmark Test Case Breakdown ({report.results.length} Queries Evaluated)
          </h3>

          <div className="space-y-4">
            {report.results.map((res, i) => (
              <div
                key={res.benchmark_id}
                className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-xs font-mono font-bold">
                      #{i + 1}
                    </span>
                    <h4 className="text-sm font-bold text-white">{res.query}</h4>
                  </div>
                  <div className="flex items-center space-x-3 text-xs">
                    <span className="text-slate-400">Latency: {res.latency_ms} ms</span>
                    <span className={`px-2 py-0.5 rounded font-semibold ${
                      res.hallucination_detected ? "bg-red-950 text-red-400" : "bg-emerald-950 text-emerald-400"
                    }`}>
                      {res.hallucination_detected ? "Hallucination Detected" : "Grounded & Verified"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="font-bold text-slate-400 uppercase tracking-wider">
                      Ground Truth Reference:
                    </span>
                    <p className="text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-900">
                      {res.ground_truth_answer}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="font-bold text-emerald-400 uppercase tracking-wider">
                      System Predicted Answer:
                    </span>
                    <p className="text-slate-200 bg-slate-950 p-3 rounded-lg border border-slate-900">
                      {res.predicted_answer}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-xs text-slate-400 pt-1">
                  <span>P@5: {(res.precision_at_k * 100).toFixed(0)}%</span>
                  <span>•</span>
                  <span>R@5: {(res.recall_at_k * 100).toFixed(0)}%</span>
                  <span>•</span>
                  <span>MRR: {res.mrr.toFixed(2)}</span>
                  <span>•</span>
                  <span>Groundedness: {(res.groundedness_score * 100).toFixed(0)}%</span>
                  <span>•</span>
                  <span>Citation Precision: {(res.citation_precision * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
