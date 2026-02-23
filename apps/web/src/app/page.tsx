"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface Stats {
  sourceEvents: number;
  interactions: number;
  tasks: number;
  pendingApprovals: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/debug/stats`)
      .then((r) => r.json())
      .then(setStats)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <main style={{ padding: "2rem", maxWidth: 800, margin: "0 auto" }}>
        <h1>Threaded Nexus</h1>
        <p style={{ color: "var(--warning)" }}>Could not load stats: {error}</p>
        <p>Ensure the API is running at {API_URL}</p>
      </main>
    );
  }

  return (
    <main style={{ padding: "2rem", maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ marginBottom: "0.5rem" }}>Threaded Nexus</h1>
      <p style={{ color: "var(--muted)", marginBottom: "2rem" }}>
        Personal CRM + outreach copilot
      </p>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <StatCard label="Source events" value={stats?.sourceEvents ?? "—"} />
        <StatCard label="Interactions" value={stats?.interactions ?? "—"} />
        <StatCard label="Tasks" value={stats?.tasks ?? "—"} />
        <StatCard
          label="Pending approvals"
          value={stats?.pendingApprovals ?? "—"}
          href="/approvals"
        />
      </section>

      <nav>
        <Link href="/approvals">Manage approvals →</Link>
      </nav>
    </main>
  );
}

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number | string;
  href?: string;
}) {
  const content = (
    <div
      style={{
        background: "var(--surface)",
        padding: "1.25rem",
        borderRadius: 8,
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
        {label}
      </div>
      <div style={{ fontSize: "1.5rem", fontWeight: 600 }}>{value}</div>
    </div>
  );
  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
