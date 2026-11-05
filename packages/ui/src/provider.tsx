"use client";

import { RUNTIME_SERVICE_IDS } from "@next-devtools/contracts";
import {
	createCoreRuntimeServices,
	createPluginRegistry,
} from "@next-devtools/core";
import type { CoreRuntimeServices } from "@next-devtools/core";
import { isDevEnvironment } from "@next-devtools/host-next/dev-guard";
import { openInEditorAction } from "@next-devtools/host-next/open-in-editor-action";
import type { createRouteRuntimeService } from "@next-devtools/host-next/route-runtime";
import type { DevtoolsPlugin } from "@next-devtools/plugin-sdk";
import {
	type ReactRuntimeService,
	createReactFiberAdapter,
	createReactRuntimeService,
	reactCapabilityDescriptors,
} from "@next-devtools/runtime-react";
import type { ResolvedElementSource } from "@next-devtools/source-inspector";
import * as React from "react";
import { createPortal } from "react-dom";
import { ElementPicker } from "./components/element-picker.js";
import { devtoolsCssText } from "./css/devtools-css.generated.js";
import { createInitialRouteService } from "./helpers/route-service-bootstrap.js";
import { DevtoolsShell } from "./shell/shell.js";

export interface DevtoolsProviderProps {
	plugins?: DevtoolsPlugin[];
	enabled?: boolean;
	/** Wrap the provider's children with React's supported Profiler callback. */
	enableProfiler?: boolean;
	children?: React.ReactNode;
}

export function DevtoolsProvider({
	plugins = [],
	enabled,
	enableProfiler = false,
	children,
}: DevtoolsProviderProps) {
	const dev = enabled ?? isDevEnvironment();
	const reactServiceRef = React.useRef<ReactRuntimeService | null>(null);
	if (!reactServiceRef.current) {
		reactServiceRef.current = createReactRuntimeService();
	}
	const runtimeServicesRef = React.useRef<CoreRuntimeServices | null>(null);
	if (!runtimeServicesRef.current) {
		runtimeServicesRef.current = createCoreRuntimeServices();
	}
	const routeServiceRef = React.useRef<ReturnType<
		typeof createRouteRuntimeService
	> | null>(null);
	if (!routeServiceRef.current) {
		routeServiceRef.current = createInitialRouteService();
	}
	const registryRef = React.useRef<ReturnType<
		typeof createPluginRegistry
	> | null>(null);
	if (!registryRef.current) {
		registryRef.current = createPluginRegistry({
			runtimeServices: runtimeServicesRef.current,
			externalServices: [
				{
					id: RUNTIME_SERVICE_IDS.react,
					service: reactServiceRef.current,
				},
				{
					id: RUNTIME_SERVICE_IDS.routes,
					service: routeServiceRef.current,
				},
			],
		});
	}
	const [container, setContainer] = React.useState<HTMLDivElement | null>(null);
	const [globalPicking, setGlobalPicking] = React.useState(false);

	React.useEffect(() => {
		const requestPick = () => setGlobalPicking(true);
		window.addEventListener("next-devtools:pick-element", requestPick);
		return () =>
			window.removeEventListener("next-devtools:pick-element", requestPick);
	}, []);

	const handleGlobalPick = React.useCallback(
		async (_element: HTMLElement, source: ResolvedElementSource | null) => {
			setGlobalPicking(false);
			if (!source?.filePath || !source.lineNumber) return;
			const result = await openInEditorAction({
				path: source.filePath,
				line: source.lineNumber,
				column: source.columnNumber ?? 1,
				editor: "vscode",
			});
			if (!result.ok) {
				console.warn(
					"[next-devtools] failed to open source in VS Code",
					result.reason,
				);
			}
		},
		[],
	);

	// Connect the React runtime bridge and publish capabilities.
	React.useEffect(() => {
		const reg = registryRef.current;
		const reactService = reactServiceRef.current;
		const runtimeServices = runtimeServicesRef.current;
		if (!dev || !reg || !reactService || !runtimeServices) return;
		const diagnostics = runtimeServices.diagnostics;

		const publishReactCapabilities = () => {
			for (const capability of reactCapabilityDescriptors(
				reactService.getSnapshot(),
			)) {
				reg.capabilities.provide(capability);
			}
		};

		reg.capabilities.provide({
			id: "next.route.index",
			availability: "available",
			source: "static",
			permission: "read",
		});
		reg.capabilities.provide({
			id: "next.navigation",
			availability: "requires-instrumentation",
			source: "next",
			permission: "read",
		});
		reg.capabilities.provide({
			id: "source.open-in-editor",
			availability: "available",
			source: "static",
			permission: "action",
		});

		const adapter = createReactFiberAdapter();
		reactService.setAdapter(adapter);
		publishReactCapabilities();
		const unsubscribeReact = reactService.subscribe(publishReactCapabilities);
		void reactService.refreshRoots().then(publishReactCapabilities);

		const onWindowError = (event: ErrorEvent) => {
			diagnostics.record({
				kind: "error",
				error: event.error ?? event.message,
				route: window.location.href,
			});
		};
		const onUnhandledRejection = (event: PromiseRejectionEvent) => {
			diagnostics.record({
				kind: "unhandled-rejection",
				error: event.reason,
				route: window.location.href,
			});
		};
		window.addEventListener("error", onWindowError);
		window.addEventListener("unhandledrejection", onUnhandledRejection);

		// Start network capture.
		try {
			runtimeServicesRef.current?.network.start();
		} catch {
			/* ignore */
		}
		runtimeServicesRef.current?.timeline.startRecording();
		const unregisterReactTimeline =
			runtimeServicesRef.current?.timeline.registerLayer({
				id: "react-render",
				label: "React commits",
				schema: { rendererId: "number", rootId: "string", priority: "number" },
			});
		const unregisterNavigationTimeline =
			runtimeServicesRef.current?.timeline.registerLayer({
				id: "navigation",
				label: "Navigation",
				schema: { url: "string" },
			});
		const unsubscribeReactCommits = reactService.subscribeToCommits((event) => {
			runtimeServicesRef.current?.timeline.emitSilently({
				layer: "react-render",
				type: "commit",
				payload: {
					rendererId: event.rendererId,
					...(event.rootId ? { rootId: event.rootId } : {}),
					...(event.priority !== undefined ? { priority: event.priority } : {}),
				},
			});
		});

		const emitNavigation = () => {
			runtimeServicesRef.current?.timeline.emit({
				layer: "navigation",
				type: "navigation",
				payload: { url: window.location.href },
			});
		};

		// Track navigation for the route runtime.
		const routeService = routeServiceRef.current;
		const onLocationChange = () => {
			try {
				routeService?.setLocation(window.location.href);
				emitNavigation();
			} catch {
				/* ignore */
			}
		};
		window.addEventListener("popstate", onLocationChange);
		// Patch history methods to observe client-side navigation.
		const originalPushState = history.pushState.bind(history);
		const originalReplaceState = history.replaceState.bind(history);
		history.pushState = (...args: Parameters<typeof history.pushState>) => {
			originalPushState(...args);
			onLocationChange();
		};
		history.replaceState = (
			...args: Parameters<typeof history.replaceState>
		) => {
			originalReplaceState(...args);
			onLocationChange();
		};

		return () => {
			unsubscribeReact();
			unsubscribeReactCommits();
			unregisterReactTimeline?.unregister();
			unregisterNavigationTimeline?.unregister();
			reactService.setAdapter(undefined);
			try {
				runtimeServicesRef.current?.network.stop();
				runtimeServicesRef.current?.timeline.stopRecording();
			} catch {
				/* ignore */
			}
			window.removeEventListener("popstate", onLocationChange);
			window.removeEventListener("error", onWindowError);
			window.removeEventListener("unhandledrejection", onUnhandledRejection);
			history.pushState = originalPushState;
			history.replaceState = originalReplaceState;
		};
	}, [dev]);

	React.useEffect(() => {
		if (!dev || !enableProfiler) return;
		const registration = runtimeServicesRef.current?.timeline.registerLayer({
			id: "react-profiler",
			label: "React Profiler",
			schema: {
				id: "string",
				phase: "string",
				actualDuration: "number",
				baseDuration: "number",
				startTime: "number",
				commitTime: "number",
			},
		});
		return () => registration?.unregister();
	}, [dev, enableProfiler]);

	const onProfilerRender = React.useCallback<React.ProfilerOnRenderCallback>(
		(id, phase, actualDuration, baseDuration, startTime, commitTime) => {
			if (!dev || !enableProfiler) return;
			runtimeServicesRef.current?.timeline.emit({
				layer: "react-profiler",
				type: "commit",
				payload: {
					id,
					phase,
					actualDuration,
					baseDuration,
					startTime,
					commitTime,
				},
			});
		},
		[dev, enableProfiler],
	);

	// Register plugins once the runtime services they depend on are available.
	React.useEffect(() => {
		const reg = registryRef.current;
		if (!dev || !reg) return;
		const registered: string[] = [];
		for (const p of plugins) {
			try {
				reg.register(p);
				registered.push(p.manifest.id);
			} catch (error) {
				// A failing plugin registration must not silently vanish.
				console.error(
					"[next-devtools] failed to register plugin",
					p?.manifest?.id,
					error,
				);
			}
		}

		return () => {
			for (const id of registered) {
				void reg.dispose(id);
			}
		};
	}, [dev, plugins]);

	// Tear down the registry and runtime service when the provider unmounts.
	React.useEffect(() => {
		const reg = registryRef.current;
		const reactService = reactServiceRef.current;
		if (!reg || !reactService) return;
		return () => {
			void reg.disposeAll();
			reactService.dispose();
		};
	}, []);

	// Create an isolated shadow root (own compiled CSS) and portal the shell into
	// it, so the DevTools never inherits or leaks styles from/to the host app.
	React.useEffect(() => {
		if (!dev) return;

		const host = document.createElement("devtools-root");
		document.body.appendChild(host);
		const shadow = host.attachShadow({ mode: "open" });

		const style = document.createElement("style");
		style.textContent = devtoolsCssText;
		shadow.appendChild(style);

		const el = document.createElement("div");
		shadow.appendChild(el);
		setContainer(el);

		return () => {
			host.remove();
			setContainer(null);
		};
	}, [dev]);

	const app = enableProfiler ? (
		<React.Profiler id="next-devtools-app" onRender={onProfilerRender}>
			{children}
		</React.Profiler>
	) : (
		children
	);

	return (
		<>
			{app}
			{container && registryRef.current
				? createPortal(
						<>
							<DevtoolsShell registry={registryRef.current} enabled />
							<ElementPicker
								active={globalPicking}
								onPick={handleGlobalPick}
								onCancel={() => setGlobalPicking(false)}
							/>
						</>,
						container,
					)
				: null}
		</>
	);
}
