"use client";

import * as React from "react";
import { resolveElementSource } from "@next-devtools/source-inspector";
import type { ResolvedElementSource } from "@next-devtools/source-inspector";

export interface PickedElement {
  element: HTMLElement;
  source: Awaited<ReturnType<typeof resolveElementSource>>;
}

export interface ElementPickerProps {
  active: boolean;
  onPick: (
    el: HTMLElement,
    source: Awaited<ReturnType<typeof resolveElementSource>>,
  ) => void;
  onCancel: () => void;
}

export function resolveInspectableTarget(
  target: EventTarget | null,
): HTMLElement | null {
  let element: Element | null =
    target instanceof HTMLElement
      ? target
      : target instanceof Element
        ? target.parentElement
        : null;
  if (!element) return null;
  if (element instanceof SVGElement && element.parentElement) {
    element = element.parentElement;
  }
  if (!(element instanceof HTMLElement)) return null;
  if (element.closest("devtools-root")) return null;
  const root = element.getRootNode();
  if (
    typeof ShadowRoot !== "undefined" &&
    root instanceof ShadowRoot &&
    root.host.matches("devtools-root")
  ) {
    return null;
  }
  return element;
}

export function isInspectableTarget(
  target: EventTarget | null,
): target is HTMLElement {
  return resolveInspectableTarget(target) !== null;
}

export function ElementHighlight({ element }: { element: HTMLElement | null }) {
  const [rect, setRect] = React.useState<DOMRect | null>(null);

  React.useEffect(() => {
    if (!element || !element.isConnected) {
      setRect(null);
      return;
    }
    const update = () => setRect(element.getBoundingClientRect());
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [element]);

  if (!rect) return null;
  return (
    <div
      data-next-devtools-highlight="selected"
      aria-hidden
      style={{
        position: "fixed",
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        border: "2px solid #2563eb",
        background: "rgba(37,99,235,0.10)",
        pointerEvents: "none",
        zIndex: 2147483645,
      }}
    />
  );
}

interface ParentFrame {
  name: string;
  filePath: string | null;
  lineNumber: number | null;
}

export function ElementPicker({
  active,
  onPick,
  onCancel,
}: ElementPickerProps) {
  const [hover, setHover] = React.useState<HTMLElement | null>(null);
  const hoverRef = React.useRef<HTMLElement | null>(null);
  const [, force] = React.useReducer((x: number) => x + 1, 0);
  const [source, setSource] = React.useState<ResolvedElementSource | null>(
    null,
  );
  const [parents, setParents] = React.useState<ParentFrame[]>([]);
  const [parentIdx, setParentIdx] = React.useState(0);

  React.useEffect(() => {
    if (!active) {
      setHover(null);
      hoverRef.current = null;
      setSource(null);
      setParents([]);
      setParentIdx(0);
      return;
    }

    const onMove = (e: MouseEvent) => {
      const t = resolveInspectableTarget(e.target);
      if (!t) return;
      if (hoverRef.current === t) {
        force();
        return;
      }
      hoverRef.current = t;
      setHover(t);
      void resolveElementSource(t).then((s) => {
        setSource(s);
        setParents(s?.parentComponents ?? []);
        setParentIdx(0);
      });
    };

    const onClick = (e: MouseEvent) => {
      // Isolate the pick from the inspected application: stop the event from
      // reaching React root handlers so the underlying control never fires.
      e.preventDefault();
      e.stopPropagation();
      const t = resolveInspectableTarget(e.target);
      if (!t) return;
      void resolveElementSource(t).then((s) => onPick(t, s));
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };

    const refresh = () => force();
    window.addEventListener("scroll", refresh, true);
    window.addEventListener("resize", refresh);

    document.addEventListener("mousemove", onMove, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("scroll", refresh, true);
      window.removeEventListener("resize", refresh);
      document.removeEventListener("mousemove", onMove, true);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [active, onPick, onCancel]);

  if (!active || !hover) return null;
  const rect = hover.getBoundingClientRect();
  const compName = source?.componentName ?? "Unknown";
  const file = source?.filePath ?? null;
  const line = source?.lineNumber ?? null;
  const col = source?.columnNumber ?? null;

  const cycleParent = () => {
    if (parents.length <= 1) return;
    setParentIdx((i) => (i + 1) % parents.length);
  };

  return (
    <>
      <div
        aria-hidden
        style={{
          position: "fixed",
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          border: "2px solid #ff4757",
          background: "rgba(255,71,87,0.12)",
          pointerEvents: "none",
          zIndex: 2147483646,
        }}
      />
      <div
        style={{
          position: "fixed",
          top: Math.max(8, rect.top - 60),
          left: rect.left,
          background: "rgba(0,0,0,0.85)",
          color: "#fff",
          padding: "6px 10px",
          borderRadius: 6,
          fontSize: 12,
          zIndex: 2147483647,
          maxWidth: 400,
          pointerEvents: "none",
        }}
      >
        <div style={{ fontWeight: 600 }}>{compName}</div>
        {file && (
          <div style={{ fontSize: 11, opacity: 0.8 }}>
            {file}
            {line ? `:${line}${col ? `:${col}` : ""}` : ""}
          </div>
        )}
        {parents.length > 1 && (
          <button
            type="button"
            onClick={cycleParent}
            style={{
              marginTop: 4,
              fontSize: 10,
              opacity: 0.85,
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.4)",
              color: "#fff",
              borderRadius: 4,
              padding: "1px 6px",
              cursor: "pointer",
            }}
          >
            Parent: {parents[parentIdx]?.name ?? "—"} (click to walk up)
          </button>
        )}
      </div>
    </>
  );
}
