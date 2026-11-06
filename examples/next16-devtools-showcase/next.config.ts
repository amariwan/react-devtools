import type { NextConfig } from "next";
import { withNextDevtools } from "next-devtools";

const nextConfig: NextConfig = {
	cacheComponents: true,
	...(process.env.NODE_ENV === "production" ? {} : {}),
	partialPrefetching: true,
};

export default withNextDevtools(nextConfig, {
	instrumentationClientModule: "./src/devtools-instrumentation-client.ts",
});
