import type { NextConfig } from "next";
import { withNextDevtools } from "@next-devtools/next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
};

export default withNextDevtools(nextConfig);
