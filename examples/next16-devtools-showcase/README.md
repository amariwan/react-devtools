# Next.js 16 DevTools Showcase

A complete example app demonstrating the Next.js DevTools monorepo packages.

## Run

```bash
pnpm install
pnpm --filter next16-devtools-showcase dev
```

Open http://localhost:3000. The DevTools launcher appears in dev mode only.

## Production

```bash
pnpm --filter next16-devtools-showcase build
pnpm --filter next16-devtools-showcase start
```

DevTools runtime is not loaded in production; `/devframes` returns 404.

## Features demonstrated

- Dashboard with Zustand + Redux state
- Projects with dynamic routes
- Tasks with TanStack Query + API routes
- Analytics with Recharts
- Settings forms
- Loading/error boundaries
- Custom plugin (showcase-custom-inspector)

## License

The showcase code is released under the [MIT License](../../LICENSE). Third-party
dependencies retain their own copyright and license notices.
