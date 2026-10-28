import { NextResponse } from "next/server";

export async function GET() {
  const users = [
    { id: 1, name: "Ada Lovelace", email: "ada@example.dev", role: "Engineer" },
    {
      id: 2,
      name: "Alan Turing",
      email: "alan@example.dev",
      role: "Researcher",
    },
    {
      id: 3,
      name: "Grace Hopper",
      email: "grace@example.dev",
      role: "Engineer",
    },
    {
      id: 4,
      name: "Edsger Dijkstra",
      email: "edsger@example.dev",
      role: "Scientist",
    },
  ];
  return NextResponse.json(users);
}
