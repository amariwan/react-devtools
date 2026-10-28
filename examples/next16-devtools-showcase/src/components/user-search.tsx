"use client";

import * as React from "react";
import { Input } from "./ui/input";

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export function UserSearch({ users: initial }: { users?: User[] }) {
  const [users, setUsers] = React.useState<User[]>(initial ?? []);
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    if (initial) {
      setUsers(initial);
      return;
    }
    let cancelled = false;
    fetch("/api/users")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: User[]) => {
        if (!cancelled) setUsers(data);
      })
      .catch(() => {
        if (!cancelled) setUsers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [initial]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q),
    );
  }, [users, query]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Input
        value={query}
        onChange={setQuery}
        placeholder="Search users by name, email, or role…"
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map((u) => (
          <div
            key={u.id}
            style={{
              border: "1px solid #e4e4e7",
              borderRadius: 8,
              padding: "8px 12px",
            }}
          >
            <strong>{u.name}</strong>{" "}
            <span style={{ fontSize: 13, color: "#71717a" }}>{u.email}</span>
            <div style={{ fontSize: 12, color: "#71717a" }}>{u.role}</div>
          </div>
        ))}
        {filtered.length === 0 ? (
          <p style={{ fontSize: 13, color: "#71717a" }}>No users found.</p>
        ) : null}
      </div>
    </div>
  );
}
