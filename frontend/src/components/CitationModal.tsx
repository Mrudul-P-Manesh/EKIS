"use client";

import { Citation } from "@/lib/types";
import { X, FileText, CheckCircle2, ShieldAlert, Tag, Layers } from "lucide-react";

interface CitationModalProps {
  citation: Citation | null;
  onClose: () => void;
}

export function CitationModal({ citation, onClose }: CitationModalProps) {
  if (!citation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0f172a] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <span className="px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-400 font-mono text-sm font-semibold border border-blue-500/30">
              {citation.source_tag}
            </span>
            <div>
              <h3 className="text-base font-semibold text-white truncate max-w-md">
                {citation.file_name}
              </h3>
              <p className="text-xs text-slate-400">
                {citation.section_heading || "General Context"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Metadata badges */}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              <Layers className="h-3.5 w-3.5 text-slate-400" />
              <span>Type: {citation.source_type.toUpperCase()}</span>
            </span>
            {citation.service_name && (
              <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-indigo-950/60 text-indigo-300 border border-indigo-500/30">
                <Tag className="h-3.5 w-3.5 text-indigo-400" />
                <span>Service: {citation.service_name}</span>
              </span>
            )}
            <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Confidence: {(citation.confidence * 100).toFixed(1)}%</span>
            </span>
          </div>

          {/* Extracted Evidence Quote */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Verified Evidence Extract
            </label>
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 text-sm font-mono leading-relaxed whitespace-pre-wrap">
              {citation.exact_quote_or_span || "Full section context verified in retrieved document store."}
            </div>
          </div>

          <div className="text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-800/80">
            <span>Doc ID: {citation.doc_id.slice(0, 16)}...</span>
            <span>Chunk ID: {citation.chunk_id}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
