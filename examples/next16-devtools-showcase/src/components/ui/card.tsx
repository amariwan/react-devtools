import * as React from "react";

export interface CardProps {
  title?: string;
  children: React.ReactNode;
}

export function Card({ title, children }: CardProps) {
  return (
    <section
      style={{
        border: "1px solid #e4e4e7",
        borderRadius: 12,
        padding: 16,
        marginTop: 24,
        background: "#ffffff",
      }}
    >
      {title ? (
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 12px" }}>
          {title}
        </h2>
      ) : null}
      {children}
    </section>
  );
}
