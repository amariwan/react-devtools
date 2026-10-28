import * as React from "react";

export function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        borderRadius: 999,
        border: "1px solid #e4e4e7",
        padding: "2px 10px",
        fontSize: 12,
        fontWeight: 500,
        background: "#f9fafb",
      }}
    >
      {children}
    </span>
  );
}
