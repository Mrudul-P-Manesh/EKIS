"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Terminal, 
  Cpu, 
  Network, 
  FolderGit2, 
  Activity, 
  ArrowRight, 
  Clock, 
  Sparkles, 
  X,
  Command
} from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuery?: (query: string) => void;
}

export function CommandPalette({ isOpen, onClose, onSelectQuery }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ekis_recent_queries");
      if (saved) {
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      }
    } catch {}
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const navItems = [
    { label: "Console - Grounded Knowledge Search", href: "/", icon: Terminal, section: "Navigation" },
    { label: "Debugger - Retrieval Funnel Trace", href: "/debugger", icon: Cpu, section: "Navigation" },
    { label: "Knowledge Graph - Relational Topology", href: "/graph", icon: Network, section: "Navigation" },
    { label: "Documents - Corpus & Chunks Explorer", href: "/documents", icon: FolderGit2, section: "Navigation" },
    { label: "Evaluation - RAG Benchmark Suite", href: "/evaluation", icon: Activity, section: "Navigation" },
  ];

  const suggestedQueries = [
    "Why is the authentication service returning 401 errors after deployment?",
    "What is the token expiration TTL and key rotation policy specified in ADR-004?",
    "What caused incident INC-401 and how was it mitigated?",
    "How does auth_middleware.py verify JWT tokens?",
    "What are the dependencies and databases used by auth-service?"
  ];

  const filteredNav = navItems.filter((i) =>
    i.label.toLowerCase().includes(search.toLowerCase())
  );

  const filteredQueries = suggestedQueries.filter((q) =>
    q.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectNav = (href: string) => {
    router.push(href);
    onClose();
  };

  const handleSelectQuery = (q: string) => {
    if (onSelectQuery) {
      onSelectQuery(q);
    } else {
      router.push(`/?q=${encodeURIComponent(q)}`);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
          />

          {/* Palette Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="relative w-full max-w-2xl bg-[#111113] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-10"
          >
            {/* Input Bar */}
            <div className="flex items-center px-4 border-b border-zinc-800/80 bg-zinc-900/30">
              <Search className="h-4 w-4 text-zinc-500 mr-3 shrink-0" />
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type a command, query, or jump to view..."
                className="w-full h-12 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
              />
              <button
                onClick={onClose}
                className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto p-2 space-y-3">
              {/* Quick Navigation */}
              {filteredNav.length > 0 && (
                <div className="space-y-1">
                  <div className="px-2.5 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider font-mono">
                    Views
                  </div>
                  {filteredNav.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={i}
                        onClick={() => handleSelectNav(item.href)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition group"
                      >
                        <div className="flex items-center space-x-2.5">
                          <Icon className="h-4 w-4 text-zinc-500 group-hover:text-zinc-300 transition" />
                          <span>{item.label}</span>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-zinc-600 group-hover:text-zinc-300 transition opacity-0 group-hover:opacity-100" />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Suggested Technical Queries */}
              {filteredQueries.length > 0 && (
                <div className="space-y-1">
                  <div className="px-2.5 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider font-mono">
                    Sample Technical Questions
                  </div>
                  {filteredQueries.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectQuery(q)}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-left text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition group"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                      <span className="truncate">{q}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Recent Searches */}
              {recentSearches.length > 0 && search === "" && (
                <div className="space-y-1">
                  <div className="px-2.5 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider font-mono">
                    Recent Searches
                  </div>
                  {recentSearches.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectQuery(q)}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-left text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition"
                    >
                      <Clock className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                      <span className="truncate">{q}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-zinc-800/80 bg-zinc-950/60 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
              <div className="flex items-center space-x-3">
                <span><kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">↵</kbd> Select</span>
                <span><kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">Esc</kbd> Close</span>
              </div>
              <div className="flex items-center space-x-1">
                <Command className="h-3 w-3" />
                <span>EKIS Command Center</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
