export interface AvatarThemeVariant {
  id: string;
  name: string;
  primary: string;
  accent1: string;
  accent2: string;
  glow: string;
}

export interface AvatarConfig {
  id: string;
  name: string;
  description: string;
  themeVariants: AvatarThemeVariant[];
  defaultVariantId: string;
}

const avatars: Record<string, AvatarConfig> = {
  "solar-system": {
    id: "solar-system",
    name: "Solar System Bubble",
    description:
      "Animated chat bubble with orbiting celestial particles, pulse effects, and solar system themed decorations.",
    themeVariants: [
      {
        id: "purple-cosmos",
        name: "Purple Cosmos",
        primary: "#5c078c",
        accent1: "#FFCC00",
        accent2: "#00CCFF",
        glow: "rgba(92, 7, 140, 0.3)",
      },
      {
        id: "orange-fire",
        name: "Orange Fire",
        primary: "#F95638",
        accent1: "#FFD700",
        accent2: "#FF6B35",
        glow: "rgba(249, 86, 56, 0.3)",
      },
      {
        id: "ocean-blue",
        name: "Ocean Blue",
        primary: "#0066CC",
        accent1: "#00CED1",
        accent2: "#4169E1",
        glow: "rgba(0, 102, 204, 0.3)",
      },
      {
        id: "emerald-green",
        name: "Emerald Green",
        primary: "#059669",
        accent1: "#34D399",
        accent2: "#10B981",
        glow: "rgba(5, 150, 105, 0.3)",
      },
      {
        id: "midnight-dark",
        name: "Midnight Dark",
        primary: "#1E1E2E",
        accent1: "#CBA6F7",
        accent2: "#89B4FA",
        glow: "rgba(30, 30, 46, 0.3)",
      },
    ],
    defaultVariantId: "purple-cosmos",
  },
};

export function getAvatar(id: string): AvatarConfig | undefined {
  return avatars[id];
}

export function getAllAvatars(): AvatarConfig[] {
  return Object.values(avatars);
}

export function getAvatarThemeVariant(
  avatarId: string,
  variantId?: string,
): AvatarThemeVariant | undefined {
  const avatar = avatars[avatarId];
  if (!avatar) return undefined;
  const vid = variantId || avatar.defaultVariantId;
  return avatar.themeVariants.find((v) => v.id === vid);
}

export default avatars;
