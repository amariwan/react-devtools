import type { Metadata } from "next";
import { Suspense } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { ErrorBoundary } from "../components/error-boundary";
import { Counter } from "../components/counter";
import { UserSearch, type User } from "../components/user-search";

export const metadata: Metadata = {
  title: "Next.js DevTools Showcase",
  description: "Showcase for the Next.js DevTools",
};

async function getUsers(): Promise<User[]> {
  const res = await fetch("http://localhost:3000/api/users", {
    cache: "no-store",
  });
  if (!res.ok) return [];
  return (await res.json()) as User[];
}

/**
 * Uncached fetch lives inside its own boundary so the route can prerender and
 * stream the list in, instead of blocking the whole page (Next 16 Cache
 * Components).
 */
async function Users() {
  const users = await getUsers();
  return <UserSearch users={users} />;
}

export default function Home() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 32 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
        Next.js DevTools Showcase
      </h1>
      <p style={{ fontSize: 14, color: "#71717a", margin: "8px 0 0" }}>
        Open the DevTools (Ctrl/Cmd+K) to inspect this page: the component tree,
        routes and dynamically registered plugins.
      </p>

      <Card title="Inspected app">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 12,
          }}
        >
          <div
            style={{
              border: "1px solid #e4e4e7",
              borderRadius: 8,
              padding: 12,
            }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>
              Components
            </h3>
            <p style={{ fontSize: 12, color: "#71717a", margin: "4px 0 0" }}>
              Hierarchical component tree
            </p>
          </div>
          <div
            style={{
              border: "1px solid #e4e4e7",
              borderRadius: 8,
              padding: 12,
            }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>Pages</h3>
            <p style={{ fontSize: 12, color: "#71717a", margin: "4px 0 0" }}>
              App Router route inspection
            </p>
          </div>
          <div
            style={{
              border: "1px solid #e4e4e7",
              borderRadius: 8,
              padding: 12,
            }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>
              Timeline
            </h3>
            <p style={{ fontSize: 12, color: "#71717a", margin: "4px 0 0" }}>
              Rendering &amp; navigation events
            </p>
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <Badge>Server component · async data fetch</Badge>
        </div>
      </Card>

      <Card title="Client interactivity">
        <ErrorBoundary>
          <Counter />
        </ErrorBoundary>
        <div style={{ marginTop: 16 }}>
          <Suspense fallback={<p style={{ fontSize: 13 }}>Loading users…</p>}>
            <Users />
          </Suspense>
        </div>
        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          <Button>Save changes</Button>
        </div>
      </Card>
    </main>
  );
}
