"use client";

import { useState, useEffect } from "react";
import { fetchDocuments, uploadDocument } from "@/lib/api";
import { DocumentItem } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  RefreshCw, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  FileCode,
  Search,
  X,
  Tag,
  ExternalLink,
  Layers
} from "lucide-react";

export default function DocumentsPage() {
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [serviceName, setServiceName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);

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
      setUploadSuccess(`Ingested '${file.name}' (${res.chunks_count} chunks, ${res.entities_extracted} entities extracted into graph).`);
      loadDocs();
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload document.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const filteredDocs = docs.filter(
    (d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.service_name && d.service_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-100 flex items-center space-x-2">
            <span>Knowledge Base & Document Index</span>
          </h1>
          <p className="text-xs text-zinc-400">
            Manage and inspect indexed architectural records, incident postmortems, operational runbooks, and source code.
          </p>
        </div>

        <button
          onClick={loadDocs}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 hover:text-zinc-100 font-medium transition self-start sm:self-auto shadow-sm"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Corpus</span>
        </button>
      </div>

      {/* Ingestion Dropzone Panel */}
      <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">
            Ingest Technical Document
          </h2>
          <span className="text-[11px] text-zinc-500 font-mono">
            Auto-chunking & Knowledge Graph entity extraction
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1 space-y-1">
            <label className="text-[11px] font-medium text-zinc-400">
              Service Tag (Optional)
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
              Select Document File (.md, .pdf, .py, .yaml, .json)
            </label>
            <label className="flex items-center justify-center space-x-2 w-full px-4 py-2 border border-dashed border-zinc-700 hover:border-zinc-500 rounded-xl cursor-pointer bg-zinc-950/70 hover:bg-zinc-900 transition">
              <Upload className="h-4 w-4 text-zinc-400" />
              <span className="text-xs text-zinc-300 font-medium">
                {uploading ? "Parsing, chunking, and embedding..." : "Choose document to ingest into EKIS"}
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
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-900 text-emerald-300 text-xs flex items-center space-x-2"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{uploadSuccess}</span>
          </motion.div>
        )}

        {uploadError && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl bg-red-950/40 border border-red-900 text-red-300 text-xs flex items-center space-x-2"
          >
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            <span>{uploadError}</span>
          </motion.div>
        )}
      </div>

      {/* Document Explorer Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search indexed documents..."
            className="w-full bg-[#111113] border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
          />
          <Search className="h-3.5 w-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
        </div>

        <span className="text-xs text-zinc-500 font-mono">
          Showing {filteredDocs.length} of {docs.length} records
        </span>
      </div>

      {/* Documents Table */}
      <div className="bg-[#111113] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/60 text-zinc-400 uppercase font-mono text-[10px] border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3">Document Title</th>
                <th className="px-4 py-3">Filename</th>
                <th className="px-4 py-3">Source Type</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Ingested Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                    No documents found matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc, idx) => (
                  <motion.tr
                    key={doc.doc_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    onClick={() => setSelectedDoc(doc)}
                    className="hover:bg-zinc-900/50 cursor-pointer transition"
                  >
                    <td className="px-4 py-3 font-medium text-zinc-100 flex items-center space-x-2">
                      <FileText className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                      <span className="truncate max-w-sm">{doc.title}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-zinc-400">
                      {doc.file_name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-zinc-950 text-blue-400 border border-zinc-800 text-[10px] uppercase font-mono">
                        {doc.source_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-zinc-400">
                      {doc.service_name || "-"}
                    </td>
                    <td className="px-4 py-3 font-mono text-zinc-500 text-[11px]">
                      {doc.created_at.slice(0, 10)}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Detail Preview Modal */}
      <AnimatePresence>
        {selectedDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative w-full max-w-lg bg-[#111113] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-blue-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300 font-mono">
                    Document Metadata
                  </span>
                </div>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-zinc-500">Title:</span>
                  <div className="text-sm font-semibold text-zinc-100">{selectedDoc.title}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 font-mono text-zinc-300">
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800">
                    <span className="text-zinc-500 text-[10px] block">TYPE</span>
                    <span>{selectedDoc.source_type.toUpperCase()}</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800">
                    <span className="text-zinc-500 text-[10px] block">SERVICE</span>
                    <span>{selectedDoc.service_name || "N/A"}</span>
                  </div>
                </div>

                <div className="space-y-1 font-mono text-[11px] text-zinc-400">
                  <div>File: <span className="text-zinc-200">{selectedDoc.file_name}</span></div>
                  <div>Doc ID: <span className="text-zinc-200">{selectedDoc.doc_id}</span></div>
                  <div>Indexed At: <span className="text-zinc-200">{selectedDoc.created_at}</span></div>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800 flex justify-end">
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
