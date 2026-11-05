import { createRouteRuntimeService } from "@next-devtools/host-next/route-runtime";
import {
	type RouteFileMetadata,
	scanAppRouter,
} from "@next-devtools/host-next/route-scanner";

function routeFilesFromGlobal(): string[] {
	if (typeof window === "undefined") return [];
	const value = (
		window as unknown as { __NEXT_DEVTOOLS_ROUTE_FILES__?: unknown }
	).__NEXT_DEVTOOLS_ROUTE_FILES__;
	return Array.isArray(value)
		? value.filter((item): item is string => typeof item === "string")
		: [];
}

function routeFilesFromEnvironment(): string[] {
	const raw =
		typeof process !== "undefined"
			? process.env?.NEXT_DEVTOOLS_ROUTE_FILES
			: undefined;
	if (!raw) return [];
	try {
		const parsed: unknown = JSON.parse(raw);
		return Array.isArray(parsed)
			? parsed.filter((item): item is string => typeof item === "string")
			: [];
	} catch {
		return [];
	}
}

export function parseRouteMetadata(
	raw: string | undefined,
): Record<string, RouteFileMetadata> {
	if (!raw) return {};
	try {
		const parsed: unknown = JSON.parse(raw);
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
			return {};
		const metadata: Record<string, RouteFileMetadata> = Object.create(null);
		for (const [path, value] of Object.entries(parsed)) {
			if (!value || typeof value !== "object" || Array.isArray(value)) continue;
			const execution = (value as Record<string, unknown>).execution;
			if (
				execution === "server" ||
				execution === "client" ||
				execution === "unknown"
			) {
				metadata[path] = { execution };
			}
		}
		return metadata;
	} catch {
		return {};
	}
}

export function createInitialRouteService() {
	const files = routeFilesFromEnvironment();
	const appRoot =
		typeof process !== "undefined" &&
		typeof process.env?.NEXT_DEVTOOLS_APP_ROOT === "string"
			? process.env.NEXT_DEVTOOLS_APP_ROOT
			: "app";
	const metadata = parseRouteMetadata(
		typeof process !== "undefined"
			? process.env?.NEXT_DEVTOOLS_ROUTE_METADATA
			: undefined,
	);
	const tree = scanAppRouter(
		files.length ? files : routeFilesFromGlobal(),
		appRoot,
		metadata,
	);
	return createRouteRuntimeService({
		tree,
		url: typeof window !== "undefined" ? window.location.href : "/",
	});
}
