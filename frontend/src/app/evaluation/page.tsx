"use client";

import { useState, useEffect } from "react";
import { runEvaluation } from "@/lib/api";
import { AggregateEvaluationReport } from "@/lib/types";
import { 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  Activity,
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
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-100">
            RAG Evaluation & Benchmarks
          </h1>
          <p className="text-xs text-zinc-400">
            Benchmark Precision@k, Recall@k, Mean Reciprocal Rank (MRR), Citation Precision, and Groundedness.
          </p>
        </div>

        <button
          onClick={executeEvaluation}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-900 hover:bg-white font-medium text-xs disabled:opacity-50 transition self-start sm:self-auto shadow-sm"
        >
          {loading ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span>Running Benchmarks...</span>
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Run Evaluation Suite</span>
            </>
          )}
        </button>
      </div>

      {report && (
        <div className="space-y-6">
          {/* KPI Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 rounded-xl bg-[#111113] border border-zinc-800 space-y-1">
              <div className="text-zinc-500 text-[10px] uppercase font-mono">Precision@k</div>
              <div className="text-xl font-bold text-zinc-100 font-mono">
                {(report.mean_precision_at_k * 100).toFixed(1)}%
              </div>
              <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full" 
                  style={{ width: `${report.mean_precision_at_k * 100}%` }}
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#111113] border border-zinc-800 space-y-1">
              <div className="text-zinc-500 text-[10px] uppercase font-mono">Recall@k</div>
              <div className="text-xl font-bold text-zinc-100 font-mono">
                {(report.mean_recall_at_k * 100).toFixed(1)}%
              </div>
              <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full" 
                  style={{ width: `${report.mean_recall_at_k * 100}%` }}
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#111113] border border-zinc-800 space-y-1">
              <div className="text-zinc-500 text-[10px] uppercase font-mono">MRR Score</div>
              <div className="text-xl font-bold text-zinc-100 font-mono">
                {report.mean_mrr.toFixed(3)}
              </div>
              <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full" 
                  style={{ width: `${report.mean_mrr * 100}%` }}
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#111113] border border-zinc-800 space-y-1">
              <div className="text-zinc-500 text-[10px] uppercase font-mono">Groundedness</div>
              <div className="text-xl font-bold text-emerald-400 font-mono">
                {(report.mean_groundedness * 100).toFixed(1)}%
              </div>
              <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full" 
                  style={{ width: `${report.mean_groundedness * 100}%` }}
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#111113] border border-zinc-800 space-y-1">
              <div className="text-zinc-500 text-[10px] uppercase font-mono">Citation Prec.</div>
              <div className="text-xl font-bold text-zinc-100 font-mono">
                {(report.mean_citation_precision * 100).toFixed(1)}%
              </div>
              <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full" 
                  style={{ width: `${report.mean_citation_precision * 100}%` }}
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#111113] border border-zinc-800 space-y-1">
              <div className="text-zinc-500 text-[10px] uppercase font-mono">Hallucination</div>
              <div className="text-xl font-bold text-zinc-300 font-mono">
                {(report.hallucination_rate * 100).toFixed(1)}%
              </div>
              <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-red-500 h-full rounded-full" 
                  style={{ width: `${report.hallucination_rate * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Test Case Breakdown Table */}
          <div className="bg-[#111113] border border-zinc-800 rounded-xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Evaluation Test Queries ({report.results.length})
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-900/60 text-zinc-400 uppercase font-mono text-[10px] border-b border-zinc-800">
                  <tr>
                    <th className="px-4 py-3">Benchmark Query</th>
                    <th className="px-4 py-3">P@k</th>
                    <th className="px-4 py-3">R@k</th>
                    <th className="px-4 py-3">MRR</th>
                    <th className="px-4 py-3">Groundedness</th>
                    <th className="px-4 py-3">Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {report.results.map((item, idx) => (
                    <tr key={idx} className="hover:bg-zinc-900/40 transition">
                      <td className="px-4 py-3 font-medium text-zinc-100 max-w-sm truncate">
                        {item.query}
                      </td>
                      <td className="px-4 py-3 font-mono text-zinc-200">
                        {(item.precision_at_k * 100).toFixed(0)}%
                      </td>
                      <td className="px-4 py-3 font-mono text-zinc-200">
                        {(item.recall_at_k * 100).toFixed(0)}%
                      </td>
                      <td className="px-4 py-3 font-mono text-zinc-200">
                        {item.mrr.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 font-mono text-emerald-400">
                        {(item.groundedness_score * 100).toFixed(0)}%
                      </td>
                      <td className="px-4 py-3 font-mono text-zinc-500">
                        {item.latency_ms.toFixed(1)} ms
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
