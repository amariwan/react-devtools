import { RUNTIME_SERVICE_IDS } from "@next-devtools/contracts";
import {
	type DebugSession,
	type DiagnosticsRuntime,
	type NetworkRuntimeService,
	type PluginRegistry,
	captureDebugSession,
	compareDebugSessions,
} from "@next-devtools/core";
import * as React from "react";
import {
	DEBUG_SESSION_SHARING_KEY,
	SHARED_DEBUG_SESSION_STORAGE_KEY,
	loadDebugSessions,
	saveDebugSessions,
} from "../debug-session-storage.js";
import type { TimelinePanelData } from "../timeline-data.js";

export function useDebugSessions(
	registry: PluginRegistry,
	events: TimelinePanelData["events"],
) {
	const [shareDebugSessions, setShareDebugSessions] = React.useState(
		() =>
			typeof window !== "undefined" &&
			window.localStorage.getItem(DEBUG_SESSION_SHARING_KEY) === "1",
	);
	const [debugSessions, setDebugSessions] = React.useState<DebugSession[]>(() =>
		loadDebugSessions(
			typeof window === "undefined"
				? undefined
				: window.localStorage.getItem(DEBUG_SESSION_SHARING_KEY) === "1"
					? window.localStorage
					: window.sessionStorage,
			typeof window !== "undefined" &&
				window.localStorage.getItem(DEBUG_SESSION_SHARING_KEY) === "1"
				? SHARED_DEBUG_SESSION_STORAGE_KEY
				: undefined,
		),
	);
	const debugSessionStorage =
		typeof window === "undefined"
			? undefined
			: shareDebugSessions
				? window.localStorage
				: window.sessionStorage;
	const debugSessionStorageKey = shareDebugSessions
		? SHARED_DEBUG_SESSION_STORAGE_KEY
		: undefined;
	React.useEffect(() => {
		saveDebugSessions(
			debugSessionStorage,
			debugSessions,
			debugSessionStorageKey,
		);
	}, [debugSessionStorage, debugSessionStorageKey, debugSessions]);
	React.useEffect(() => {
		if (typeof window === "undefined") return;
		window.localStorage.setItem(
			DEBUG_SESSION_SHARING_KEY,
			shareDebugSessions ? "1" : "0",
		);
		const sharedStorage = window.localStorage;
		if (!shareDebugSessions) return;
		const onStorage = (event: StorageEvent) => {
			if (event.storageArea !== sharedStorage) return;
			if (event.key !== SHARED_DEBUG_SESSION_STORAGE_KEY) return;
			setDebugSessions(
				loadDebugSessions(sharedStorage, SHARED_DEBUG_SESSION_STORAGE_KEY),
			);
		};
		window.addEventListener("storage", onStorage);
		return () => window.removeEventListener("storage", onStorage);
	}, [shareDebugSessions]);

	const toggleSharedSessions = (enabled: boolean) => {
		const target =
			typeof window === "undefined"
				? undefined
				: enabled
					? window.localStorage
					: window.sessionStorage;
		setDebugSessions(
			loadDebugSessions(
				target,
				enabled ? SHARED_DEBUG_SESSION_STORAGE_KEY : undefined,
			),
		);
		setShareDebugSessions(enabled);
	};
	const debugComparison = React.useMemo(() => {
		const before = debugSessions.at(-2);
		const after = debugSessions.at(-1);
		return before && after ? compareDebugSessions(before, after) : null;
	}, [debugSessions]);
	const captureSession = () => {
		const network = registry.services.get<NetworkRuntimeService>(
			RUNTIME_SERVICE_IDS.network,
		);
		const diagnostics = registry.services.get<DiagnosticsRuntime>(
			RUNTIME_SERVICE_IDS.diagnostics,
		);
		const captured = captureDebugSession({
			sessionId: `debug_${Date.now()}`,
			capturedAtUnixMs: Date.now(),
			timeline: events,
			network: network?.getSnapshot().data.entries ?? [],
			diagnostics: diagnostics?.getSnapshot().data.events ?? [],
			limit: 200,
		});
		setDebugSessions((sessions) => [...sessions, captured].slice(-2));
	};

	const exportLatestSession = () => {
		const latest = debugSessions.at(-1);
		if (!latest || typeof document === "undefined") return;
		const blob = new Blob([JSON.stringify(latest, null, 2)], {
			type: "application/json",
		});
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.download = `${latest.sessionId}.json`;
		anchor.click();
		URL.revokeObjectURL(url);
	};

	return {
		shareDebugSessions,
		debugSessions,
		debugComparison,
		toggleSharedSessions,
		captureSession,
		exportLatestSession,
		clearSessions: () => setDebugSessions([]),
	};
}
