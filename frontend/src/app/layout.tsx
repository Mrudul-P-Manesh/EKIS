import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "EKIS - Engineering Knowledge Intelligence System",
  description: "Production-grade RAG platform featuring hybrid retrieval, knowledge graphs, citations, and evaluation observability.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0b0f19] text-slate-100 antialiased selection:bg-blue-500 selection:text-white flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
          <p>Engineering Knowledge Intelligence System (EKIS) • Production Multi-Modal RAG Platform</p>
        </footer>
      </body>
    </html>
  );
}
