"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 32 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Dashboard</h1>
      <div
        style={{
          marginTop: 24,
          border: "1px solid #ef4444",
          borderRadius: 12,
          padding: 16,
        }}
      >
        <strong>Something went wrong loading this dashboard.</strong>
        <p style={{ fontSize: 13, color: "#71717a" }}>{error.message}</p>
        <button type="button" onClick={() => reset()}>
          Try again
        </button>
      </div>
    </main>
  );
}
