"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Terminal, 
  Cpu, 
  Network, 
  FolderGit2, 
  Activity,
  Layers,
  Search,
  Command
} from "lucide-react";

interface NavbarProps {
  onOpenCommandPalette?: () => void;
}

export function Navbar({ onOpenCommandPalette }: NavbarProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Console", icon: Terminal },
    { href: "/debugger", label: "Debugger", icon: Cpu },
    { href: "/graph", label: "Graph", icon: Network },
    { href: "/documents", label: "Documents", icon: FolderGit2 },
    { href: "/evaluation", label: "Evaluation", icon: Activity },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-[#09090b]/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 group-hover:border-zinc-500 transition">
              <Layers className="h-4 w-4" />
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="font-semibold text-sm tracking-tight text-zinc-100">
                EKIS
              </span>
              <span className="text-[10px] text-zinc-500 font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                v1.0
              </span>
            </div>
          </Link>
        </div>

        {/* Minimal Navigation with animated active tab */}
        <nav className="flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? "text-zinc-100"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavTab"
                    className="absolute inset-0 bg-zinc-800/90 border border-zinc-700/80 rounded-md -z-10 shadow-sm"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Actions: Command Palette Button + Status */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-400 hover:text-zinc-200 transition"
            title="Command Palette (Cmd+K)"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden md:inline text-[11px]">Command Palette</span>
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400 font-mono border border-zinc-700">
              ⌘K
            </kbd>
          </button>

          <div className="hidden sm:flex items-center space-x-1.5 px-2 py-1 rounded-md bg-zinc-900/80 border border-zinc-800 text-[11px] text-zinc-400 font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Online</span>
          </div>
        </div>
      </div>
    </header>
  );
}
