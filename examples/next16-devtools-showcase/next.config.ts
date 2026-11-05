import { withNextDevtools } from "@next-devtools/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	cacheComponents: true,
	partialPrefetching: true,
};

export default withNextDevtools(nextConfig);
