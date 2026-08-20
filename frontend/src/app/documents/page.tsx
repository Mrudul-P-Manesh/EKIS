"use client";

import { useState, useEffect } from "react";
import { fetchDocuments, uploadDocument } from "@/lib/api";
import { DocumentItem } from "@/lib/types";
import { 
  Files, 
  Upload, 
  FileText, 
  Code, 
  FileCheck, 
  Trash2, 
  RefreshCw, 
  Tag, 
  Clock, 
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export default function DocumentsPage() {
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [serviceName, setServiceName] = useState("");

  const loadDocs = async () => {
    setLoading(true);
    try {
      const data = await fetchDocuments();
      setDocs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadSuccess(null);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);
    if (serviceName) {
      formData.append("service_name", serviceName);
    }

    try {
      const res = await uploadDocument(formData);
      setUploadSuccess(`Successfully ingested '${file.name}' (${res.chunks_count} chunks, ${res.entities_extracted} entities extracted).`);
      loadDocs();
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload and ingest document.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <Files className="h-4 w-4" />
            <span>Ingestion & Repository Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Knowledge Documents & Code Repositories
          </h1>
          <p className="text-sm text-slate-400">
            Upload PDFs, Markdown ADRs, Runbooks, Python/TypeScript files, and configurations to index them into Qdrant, BM25, and Neo4j.
          </p>
        </div>

        <button
          onClick={loadDocs}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center space-x-2 shrink-0 border border-slate-700"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Upload Box */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
          <Upload className="h-4 w-4 text-blue-400" />
          <span>Ingest New Engineering Source</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div className="sm:col-span-1">
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Service / Domain Tag (Optional)
            </label>
            <input
              type="text"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              placeholder="e.g. auth-service, gateway"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Choose File (PDF, Markdown, TXT, Python, YAML)
            </label>
            <label className="flex items-center justify-center px-4 py-2.5 rounded-xl bg-slate-900 border border-dashed border-slate-700 hover:border-blue-500 text-slate-300 text-xs font-medium cursor-pointer transition">
              <Upload className="h-4 w-4 mr-2 text-blue-400" />
              <span>{uploading ? "Ingesting & Extracting Knowledge..." : "Select File to Upload & Index"}</span>
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={uploading}
                accept=".pdf,.md,.markdown,.txt,.py,.ts,.js,.yaml,.yml,.json"
                className="hidden"
              />
            </label>
          </div>
        </div>

        {uploadSuccess && (
          <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{uploadSuccess}</span>
          </div>
        )}

        {uploadError && (
          <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}
      </div>

      {/* Indexed Documents Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            Indexed Documents & Knowledge Sources ({docs.length})
          </h3>
        </div>

        <div className="divide-y divide-slate-800/80">
          {docs.length > 0 ? (
            docs.map((doc) => (
              <div
                key={doc.doc_id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-900/40 transition"
              >
                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 rounded-xl bg-slate-800 text-blue-400 shrink-0 mt-0.5">
                    {doc.source_type === "code" ? (
                      <Code className="h-5 w-5" />
                    ) : (
                      <FileText className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{doc.title}</h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400">
                      <span className="font-mono text-slate-300">{doc.file_name}</span>
                      <span>•</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {doc.source_type.toUpperCase()}
                      </span>
                      {doc.service_name && (
                        <>
                          <span>•</span>
                          <span className="px-2 py-0.5 rounded-full bg-indigo-950/60 text-indigo-300 border border-indigo-500/30">
                            {doc.service_name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-xs text-slate-500">
                  <span className="flex items-center space-x-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{new Date(doc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </span>
                  <span className="px-2 py-1 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 font-medium">
                    Indexed
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">
              No documents indexed yet. Upload a document or restart backend to seed sample architecture docs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
