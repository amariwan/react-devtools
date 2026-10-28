async function tryImport(specifier: string): Promise<boolean> {
  try {
    const importer = new Function("m", "return import(m)") as (
      m: string,
    ) => Promise<unknown>;
    await importer(specifier);
    return true;
  } catch {
    return false;
  }
}

export async function detectZustand(): Promise<boolean> {
  if (await tryImport("zustand")) return true;
  return (
    typeof window !== "undefined" &&
    Boolean(
      (window as unknown as { __ZUSTAND_STORES__?: unknown[] })
        .__ZUSTAND_STORES__,
    )
  );
}

export async function detectRedux(): Promise<boolean> {
  if (await tryImport("@reduxjs/toolkit")) return true;
  if (await tryImport("redux")) return true;
  return (
    typeof window !== "undefined" &&
    Boolean(
      (
        window as unknown as {
          __REDUX_STORE__?: unknown;
          __REDUX_STORES__?: unknown[];
        }
      ).__REDUX_STORE__ ??
      (window as unknown as { __REDUX_STORES__?: unknown[] }).__REDUX_STORES__,
    )
  );
}

export async function detectTanStackQuery(): Promise<boolean> {
  if (await tryImport("@tanstack/react-query")) return true;
  return (
    typeof window !== "undefined" &&
    Boolean(
      (window as unknown as { __TANSTACK_QUERY_CLIENT__?: unknown })
        .__TANSTACK_QUERY_CLIENT__,
    )
  );
}

export async function detectTailwindCss(): Promise<boolean> {
  if (await tryImport("tailwindcss")) return true;
  if (typeof document !== "undefined") {
    return (
      document.querySelector(
        "[class*='flex'],[class*='grid'],[class*='p-'],[class*='m-']",
      ) !== null
    );
  }
  return false;
}

export async function detectIntegration(name: string): Promise<boolean> {
  switch (name) {
    case "zustand":
      return detectZustand();
    case "redux":
      return detectRedux();
    case "tanstack-query":
      return detectTanStackQuery();
    case "tailwindcss":
      return detectTailwindCss();
    default:
      return true;
  }
}
