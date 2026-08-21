import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "EKIS - Engineering Knowledge Intelligence System",
  description: "Enterprise multi-stage RAG platform featuring hybrid vector-graph retrieval, citations, and evaluation observability.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
