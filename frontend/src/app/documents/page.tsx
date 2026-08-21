"use client";

import { useState, useEffect } from "react";
import { fetchDocuments, uploadDocument } from "@/lib/api";
import { DocumentItem } from "@/lib/types";
import { 
  Upload, 
  RefreshCw, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  FileCode
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
      setUploadSuccess(`Ingested '${file.name}' (${res.chunks_count} chunks, ${res.entities_extracted} entities extracted).`);
      loadDocs();
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload document.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-100">
            Document Ingestion & Knowledge Index
          </h1>
          <p className="text-xs text-zinc-400">
            Manage indexed architectural records, incident postmortems, operational runbooks, and source code.
          </p>
        </div>

        <button
          onClick={loadDocs}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 hover:text-zinc-100 font-medium transition self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Index</span>
        </button>
      </div>

      {/* Upload Box */}
      <div className="bg-[#111113] border border-zinc-800 rounded-xl p-5 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Ingest New Engineering Document
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1 space-y-1">
            <label className="text-[11px] font-medium text-zinc-400">
              Associated Service (Optional)
            </label>
            <input
              type="text"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              placeholder="e.g. auth-service"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
            />
          </div>

          <div className="sm:col-span-2 space-y-1">
            <label className="text-[11px] font-medium text-zinc-400">
              Select Document File (.md, .pdf, .py, .yaml)
            </label>
            <label className="flex items-center justify-center space-x-2 w-full px-4 py-2 border border-dashed border-zinc-700 hover:border-zinc-500 rounded-lg cursor-pointer bg-zinc-950 hover:bg-zinc-900 transition">
              <Upload className="h-4 w-4 text-zinc-400" />
              <span className="text-xs text-zinc-300">
                {uploading ? "Ingesting & indexing..." : "Choose a file to ingest"}
              </span>
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
                accept=".md,.txt,.pdf,.py,.ts,.js,.yaml,.yml,.json"
              />
            </label>
          </div>
        </div>

        {uploadSuccess && (
          <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-900 text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{uploadSuccess}</span>
          </div>
        )}

        {uploadError && (
          <div className="p-3 rounded-lg bg-red-950/40 border border-red-900 text-red-300 text-xs flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}
      </div>

      {/* Documents Table */}
      <div className="bg-[#111113] border border-zinc-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Indexed Engineering Corpus ({docs.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/60 text-zinc-400 uppercase font-mono text-[10px] border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3">Document Title</th>
                <th className="px-4 py-3">File Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Ingested Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {docs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                    No indexed documents found in database.
                  </td>
                </tr>
              ) : (
                docs.map((doc) => (
                  <tr key={doc.doc_id} className="hover:bg-zinc-900/40 transition">
                    <td className="px-4 py-3 font-medium text-zinc-100 flex items-center space-x-2">
                      <FileText className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                      <span className="truncate max-w-sm">{doc.title}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-zinc-400">
                      {doc.file_name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 text-[10px] uppercase font-mono">
                        {doc.source_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-zinc-400">
                      {doc.service_name || "-"}
                    </td>
                    <td className="px-4 py-3 font-mono text-zinc-500 text-[11px]">
                      {doc.created_at.slice(0, 10)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
