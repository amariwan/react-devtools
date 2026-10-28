"use client";

import * as React from "react";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Counter } from "../../components/counter";
import { UserSearch, type User } from "../../components/user-search";

export default function Dashboard() {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [submitted, setSubmitted] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const n = String(data.get("name") ?? "");
    const em = String(data.get("email") ?? "");
    setSubmitted(`Saved ${n} <${em}>`);
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 32 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Dashboard</h1>
      <p style={{ fontSize: 14, color: "#71717a", margin: "8px 0 0" }}>
        Interactive dashboard with shared UI primitives, forms, counters and
        lists.
      </p>

      <Card title="Settings form">
        <form
          onSubmit={onSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label htmlFor="name" style={{ fontSize: 13, fontWeight: 500 }}>
              Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={setName}
              placeholder="Ada Lovelace"
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label htmlFor="email" style={{ fontSize: 13, fontWeight: 500 }}>
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="ada@example.dev"
            />
          </div>
          <Button type="submit">Save changes</Button>
          {submitted ? <p style={{ fontSize: 13 }}>{submitted}</p> : null}
        </form>
      </Card>

      <Card title="State">
        <Counter />
      </Card>

      <Card title="Users">
        <UserSearch users={[] as User[]} />
      </Card>
    </main>
  );
}
