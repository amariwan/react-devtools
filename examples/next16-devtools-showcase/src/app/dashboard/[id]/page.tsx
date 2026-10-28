"use client";

import * as React from "react";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";

export default function DashboardDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const numericId = Number(id);

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 32 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
        Dashboard #{id}
      </h1>
      <Card title="Dynamic segment">
        <p style={{ fontSize: 14, margin: 0 }}>
          Route param resolved to <strong>{numericId}</strong>. This page is a
          client component rendered from a dynamic App Router segment.
        </p>
        <div style={{ marginTop: 12 }}>
          <Button onClick={() => void 0}>Open related record</Button>
        </div>
      </Card>
    </main>
  );
}
