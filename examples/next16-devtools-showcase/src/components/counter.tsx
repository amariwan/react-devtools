"use client";

import * as React from "react";

export interface CounterProps {
  initial?: number;
}

export function Counter({ initial = 0 }: CounterProps) {
  const [count, setCount] = React.useState(initial);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <button
        type="button"
        aria-label="decrement counter"
        onClick={() => setCount((c) => Math.max(0, c - 1))}
        style={buttonStyle}
      >
        −
      </button>
      <span
        aria-live="polite"
        style={{
          fontSize: 20,
          fontWeight: 700,
          minWidth: 32,
          textAlign: "center",
        }}
      >
        {count}
      </span>
      <button
        type="button"
        aria-label="increment counter"
        onClick={() => setCount((c) => c + 1)}
        style={buttonStyle}
      >
        +
      </button>
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 8,
  border: "1px solid #e4e4e7",
  background: "#f9fafb",
  fontSize: 18,
  fontWeight: 600,
  cursor: "pointer",
};
