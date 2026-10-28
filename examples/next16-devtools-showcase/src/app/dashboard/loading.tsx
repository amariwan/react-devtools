export default function DashboardLoading() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 32 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Dashboard</h1>
      <div
        style={{
          marginTop: 24,
          border: "1px solid #e4e4e7",
          borderRadius: 12,
          padding: 16,
        }}
      >
        <div
          style={{
            height: 12,
            width: "40%",
            background: "#f1f5f9",
            borderRadius: 6,
          }}
        />
        <div
          style={{
            height: 12,
            width: "70%",
            background: "#f1f5f9",
            borderRadius: 6,
            marginTop: 8,
          }}
        />
        <div
          style={{
            height: 12,
            width: "55%",
            background: "#f1f5f9",
            borderRadius: 6,
            marginTop: 8,
          }}
        />
      </div>
    </main>
  );
}
