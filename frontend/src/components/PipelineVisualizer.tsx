"use client";

import { motion } from "framer-motion";
import { 
  Binary, 
  Database, 
  Network, 
  Layers, 
  Cpu, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  Loader2,
  ArrowRight
} from "lucide-react";

interface PipelineVisualizerProps {
  isLoading: boolean;
  activeStep?: number; // 0 to 5
  stats?: {
    vectorHits?: number;
    graphHits?: number;
    fusedCount?: number;
    rerankCount?: number;
    confidenceScore?: number;
    latencyMs?: number;
  };
}

export function PipelineVisualizer({ isLoading, activeStep = 0, stats }: PipelineVisualizerProps) {
  const steps = [
    {
      id: "embed",
      title: "1. Query & Embed",
      desc: "384-dim semantic vector",
      icon: Binary,
      color: "text-blue-400",
      activeBg: "bg-blue-950/40 border-blue-800",
    },
    {
      id: "vector_graph",
      title: "2. Dual Retrieval",
      desc: "Qdrant + Neo4j Graph",
      icon: Database,
      color: "text-indigo-400",
      activeBg: "bg-indigo-950/40 border-indigo-800",
    },
    {
      id: "rrf",
      title: "3. RRF Fusion",
      desc: "Rank reciprocal merge",
      icon: Layers,
      color: "text-cyan-400",
      activeBg: "bg-cyan-950/40 border-cyan-800",
    },
    {
      id: "rerank",
      title: "4. Cross-Encoder",
      desc: "Contextual reranking",
      icon: Cpu,
      color: "text-purple-400",
      activeBg: "bg-purple-950/40 border-purple-800",
    },
    {
      id: "llm_guard",
      title: "5. LLM & Grounding",
      desc: "Citation guardrails",
      icon: ShieldCheck,
      color: "text-emerald-400",
      activeBg: "bg-emerald-950/40 border-emerald-800",
    },
  ];

  return (
    <div className="bg-[#111113] border border-zinc-800 rounded-xl p-4 shadow-lg space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider font-mono">
            RAG Pipeline Architecture
          </span>
        </div>
        {stats?.latencyMs !== undefined && (
          <span className="text-[11px] text-zinc-500 font-mono">
            Pipeline Execution: <strong className="text-zinc-200">{stats.latencyMs} ms</strong>
          </span>
        )}
      </div>

      {/* Interactive Step Nodes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 relative">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isCurrent = isLoading && activeStep === idx;
          const isCompleted = (!isLoading && stats) || (isLoading && activeStep > idx);

          return (
            <motion.div
              key={step.id}
              initial={false}
              animate={{
                scale: isCurrent ? 1.02 : 1,
                borderColor: isCurrent ? "rgba(59, 130, 246, 0.8)" : isCompleted ? "rgba(39, 39, 42, 1)" : "rgba(39, 39, 42, 0.6)",
              }}
              className={`p-2.5 rounded-lg border text-left transition relative overflow-hidden ${
                isCurrent 
                  ? step.activeBg 
                  : "bg-zinc-950/70 border-zinc-800/80"
              }`}
            >
              {/* Active Loading Beam Indicator */}
              {isCurrent && (
                <motion.div
                  layoutId="activeBeam"
                  className="absolute inset-0 bg-blue-500/10 pointer-events-none"
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                />
              )}

              <div className="flex items-center justify-between mb-1.5">
                <div className={`p-1 rounded bg-zinc-900 border border-zinc-800 ${step.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                {isCurrent ? (
                  <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
                ) : isCompleted ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-700" />
                )}
              </div>

              <div className="text-[11px] font-semibold text-zinc-200 truncate">
                {step.title}
              </div>
              <div className="text-[10px] text-zinc-500 truncate font-mono">
                {step.desc}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
