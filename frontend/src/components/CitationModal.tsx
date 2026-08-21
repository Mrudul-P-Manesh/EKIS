"use client";

import { Citation } from "@/lib/types";
import { X, FileText, CheckCircle2, ShieldAlert, Tag, Layers, ExternalLink } from "lucide-react";

interface CitationModalProps {
  citation: Citation | null;
  onClose: () => void;
}

export function CitationModal({ citation, onClose }: CitationModalProps) {
  if (!citation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-[#111113] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800/80 bg-zinc-900/40">
          <div className="flex items-center space-x-2.5">
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 font-mono text-xs font-medium border border-zinc-700">
              {citation.source_tag}
            </span>
            <div>
              <h3 className="text-xs font-semibold text-zinc-100 truncate max-w-sm">
                {citation.file_name}
              </h3>
              {citation.section_heading && (
                <p className="text-[11px] text-zinc-400 truncate">
                  {citation.section_heading}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Metadata badges */}
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            <span className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
              Type: {citation.source_type.toUpperCase()}
            </span>
            {citation.service_name && (
              <span className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
                Service: {citation.service_name}
              </span>
            )}
            <span className="px-2 py-0.5 rounded bg-zinc-900 text-emerald-400 border border-zinc-800">
              Relevance: {(citation.confidence * 100).toFixed(0)}%
            </span>
          </div>

          {/* Extracted Evidence Quote */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-zinc-400">
              Source Excerpt
            </span>
            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800/80 text-zinc-300 text-xs font-mono leading-relaxed whitespace-pre-wrap">
              {citation.exact_quote_or_span || "Full verified section context."}
            </div>
          </div>

          <div className="text-[11px] text-zinc-500 flex items-center justify-between pt-2 border-t border-zinc-800/60 font-mono">
            <span>Doc: {citation.doc_id.slice(0, 8)}...</span>
            <span>Chunk: {citation.chunk_id.slice(0, 16)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-900/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
