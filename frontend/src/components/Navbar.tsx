"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Terminal, 
  Cpu, 
  Network, 
  FolderGit2, 
  Activity,
  Layers
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Console", icon: Terminal },
    { href: "/debugger", label: "Debugger", icon: Cpu },
    { href: "/graph", label: "Graph", icon: Network },
    { href: "/documents", label: "Documents", icon: FolderGit2 },
    { href: "/evaluation", label: "Evaluation", icon: Activity },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-[#09090b]/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 group-hover:border-zinc-500 transition">
              <Layers className="h-4 w-4" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-sm tracking-tight text-zinc-100">
                EKIS
              </span>
              <span className="text-[11px] text-zinc-500 font-mono">
                / rag
              </span>
            </div>
          </Link>
        </div>

        {/* Minimal Navigation */}
        <nav className="flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Status Indicator */}
        <div className="hidden sm:flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="font-mono">Live</span>
          </div>
        </div>
      </div>
    </header>
  );
}
