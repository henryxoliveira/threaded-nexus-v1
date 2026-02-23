"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface Approval {
  id: string;
  toolName: string;
  request: object;
  status: string;
  createdAt: string;
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApprovals = () => {
    fetch(`${API_URL}/approvals`)
      .then((r) => r.json())
      .then((data: { approvals: Approval[] }) => setApprovals(data.approvals ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const decide = async (id: string, action: "approve" | "reject") => {
    const path = action === "approve" ? "approve" : "reject";
    await fetch(`${API_URL}/approvals/${id}/${path}`, { method: "POST" });
    fetchApprovals();
  };

  return (
    <main style={{ padding: "2rem", maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ marginBottom: "0.5rem" }}>Tool approvals</h1>
      <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>
        Approve or reject requested tool actions (e.g. send email, create event).
      </p>
      <Link href="/" style={{ display: "inline-block", marginBottom: "1.5rem" }}>
        ← Dashboard
      </Link>

      {error && (
        <p style={{ color: "var(--warning)" }}>Error: {error}</p>
      )}

      {loading ? (
        <p>Loading…</p>
      ) : approvals.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No pending approvals.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {approvals.map((a) => (
            <li
              key={a.id}
              style={{
                background: "var(--surface)",
                padding: "1rem",
                borderRadius: 8,
                marginBottom: "0.75rem",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: "0.5rem" }}>{a.toolName}</div>
              <pre
                style={{
                  fontSize: "0.8rem",
                  color: "var(--muted)",
                  overflow: "auto",
                  marginBottom: "0.75rem",
                }}
              >
                {JSON.stringify(a.request, null, 2)}
              </pre>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button className="primary" onClick={() => decide(a.id, "approve")}>
                  Approve
                </button>
                <button className="danger" onClick={() => decide(a.id, "reject")}>
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
