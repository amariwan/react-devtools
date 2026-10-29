import * as React from "react";
import {
  BotIcon,
  BoxIcon,
  DatabaseIcon,
  FilesIcon,
  GlobeIcon,
  InfoIcon,
  NetworkIcon,
  PaletteIcon,
  SettingsIcon,
  SparklesIcon,
} from "lucide-react";

export type PanelIconComponent = React.ComponentType<
  React.SVGProps<SVGSVGElement>
>;

/**
 * Semantic icon ids declared by plugins (`PanelDescriptor.icon`) mapped to
 * lucide components. Unknown ids fall back to a generic box so the navigation
 * rail always renders a glyph without inventing an emoji or text abbreviation.
 */
const ICON_MAP: Record<string, PanelIconComponent> = {
  overview: InfoIcon,
  components: BoxIcon,
  pages: FilesIcon,
  graph: NetworkIcon,
  css: PaletteIcon,
  network: GlobeIcon,
  store: DatabaseIcon,
  agent: BotIcon,
  sparkles: SparklesIcon,
  settings: SettingsIcon,
};

export function resolveIcon(
  name: string | null | undefined,
): PanelIconComponent {
  if (name) {
    const icon = ICON_MAP[name];
    if (icon) return icon;
  }
  return BoxIcon;
}

export { ICON_MAP };
