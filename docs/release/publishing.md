# Publishing

`@next-devtools/next` is the public entry package. Runtime dependencies that
must be resolved by consumers are public workspace packages and are included in
the Changesets release graph. `.changeset/config.json` and
`.changeset/public-runtime-packages.md` define the release policy.

The repository and workspace packages use the MIT License, copyright (c) 2026
Aland Baban. Every workspace `package.json` declares `"license": "MIT"`, and
the public package explicitly includes the root `LICENSE` file in its published
file list. Third-party dependencies retain their own copyright and license
notices; the repository MIT license does not relicense them.

All public workspace packages explicitly publish only their compiled `dist`
directory. The release gate rejects an archive containing `src`, test files, or
`tsconfig.json`.

Create the package archive from `packages/next`:

```bash
cd packages/next
bun pm pack --destination /tmp/next-devtools-pack
```

The resulting archive must contain `LICENSE` and package metadata with
`"license": "MIT"`. Verify this before publishing.

Running `bun pm pack packages/next` at the monorepo root was reproduced as a
root archive, not the public package. The compatibility suite guards the
correct invocation, rejects unresolved `workspace:*` dependencies, and checks
that source files, `tsconfig.json`, and compiled tests are not shipped. The
compatibility suite also installs the archive and its internal closure from an
isolated local file mirror, resolves external dependencies normally, and imports
`@next-devtools/next`. A hosted registry install and CI release rehearsal remain
separate checks.
