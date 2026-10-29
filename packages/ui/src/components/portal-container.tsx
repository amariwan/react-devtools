import * as React from "react";

/** Keep overlays inside the same shadow tree and theme as their trigger. */
export const DevtoolsPortalContext = React.createContext<HTMLElement | null>(
  null,
);
export function useDevtoolsPortalContainer() {
  return React.useContext(DevtoolsPortalContext);
}
