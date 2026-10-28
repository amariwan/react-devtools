"use client";

import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "ghost";
  size?: "sm" | "md";
}

export function Button({
  variant = "default",
  size = "md",
  style,
  ...props
}: ButtonProps) {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 8,
    fontWeight: 600,
    border: "1px solid transparent",
    cursor: props.disabled ? "not-allowed" : "pointer",
    opacity: props.disabled ? 0.6 : 1,
    ...style,
  };
  const variantStyle: Record<string, React.CSSProperties> = {
    default: { background: "#0f172a", color: "#ffffff" },
    secondary: {
      background: "#f1f5f9",
      color: "#0f172a",
      borderColor: "#e2e8f0",
    },
    ghost: {
      background: "transparent",
      color: "#0f172a",
      borderColor: "#e2e8f0",
    },
  };
  return (
    <button
      type="button"
      {...props}
      style={{
        ...base,
        ...variantStyle[variant],
        padding: size === "sm" ? "4px 10px" : "8px 16px",
        fontSize: size === "sm" ? 13 : 14,
        ...style,
      }}
    />
  );
}
