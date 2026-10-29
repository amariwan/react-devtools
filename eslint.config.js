import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  { ignores: ["**/dist/**", "**/node_modules/**", "**/.next/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["packages/ui/src/**/*.{ts,tsx}"],
    rules: {
      // Inside the UI package @base-ui is the allowed primitive layer.
    },
  },
  {
    files: ["!packages/ui/src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@base-ui/*", "@base-ui/react/*"],
              message:
                "Use @next-devtools/ui components instead of @base-ui directly. Add missing primitives to packages/ui/src/components/ui.",
            },
          ],
        },
      ],
    },
  },
];
