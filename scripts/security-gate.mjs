/* global console */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const files = execFileSync(
  "rg",
  [
    "--files",
    "-g",
    "!node_modules",
    "-g",
    "!dist",
    "-g",
    "!.next",
    "-g",
    "!bun.lock",
    "-g",
    "!packages/ui/src/devtools-css.generated.ts",
  ],
  { encoding: "utf8" },
)
  .trim()
  .split("\n")
  .filter(Boolean);

const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /AKIA[0-9A-Z]{16}/,
  /(?:gh[pousr]|github_pat)_[A-Za-z0-9_]{20,}/,
  /\bsk-[A-Za-z0-9]{20,}/,
];
const findings = [];
for (const file of files) {
  const content = readFileSync(file, "utf8");
  if (secretPatterns.some((pattern) => pattern.test(content)))
    findings.push(file);
}
if (findings.length > 0) {
  throw new Error(`Secret-like material found in: ${findings.join(", ")}`);
}
console.log(`security source scan: PASS (${files.length} files checked)`);
