export const RARITY_VISUALS = {
  common: { color: 0xc8b28a, glow: 0.02, label: "Common" },
  rare: { color: 0x82c8ff, glow: 0.08, label: "Rare" },
  epic: { color: 0xc79cff, glow: 0.13, label: "Epic" },
  legendary: { color: 0xffd166, glow: 0.22, label: "Legendary" },
};

export const BOW_VISUALS = {
  "starter-bow": { limb: 0x9a6237, accent: 0xd6a456, string: 0xf5e3bd, scale: 1, curve: 0.08, motif: "guild" },
  "hunter-bow": { limb: 0x7d5a34, accent: 0x8fd18a, string: 0xf0ddb3, scale: 1.02, curve: 0.12, motif: "leaf" },
  longbow: { limb: 0xb7773e, accent: 0xd9b368, string: 0xf7e5bf, scale: 1.16, curve: 0.06, motif: "range" },
  "ancient-bow": { limb: 0x5e527d, accent: 0xc79cff, string: 0xe9dbff, scale: 1.1, curve: 0.15, motif: "rune" },
  stormcaller: { limb: 0x476d82, accent: 0x82c8ff, string: 0xe6f7ff, scale: 1.13, curve: 0.18, motif: "storm" },
  frostbite: { limb: 0x6ba4b5, accent: 0x8ddcff, string: 0xf4fdff, scale: 1.08, curve: 0.16, motif: "ice" },
  sunpiercer: { limb: 0xb46034, accent: 0xffb24d, string: 0xffecc5, scale: 1.24, curve: 0.05, motif: "sun" },
  whisperwind: { limb: 0x5f8f66, accent: 0xcfffc2, string: 0xf5ffe9, scale: 1.02, curve: 0.22, motif: "wind" },
  tidepiercer: { limb: 0x3f7a89, accent: 0x5fd8ff, string: 0xe9fbff, scale: 1.17, curve: 0.1, motif: "tide" },
  bogpiercer: { limb: 0x405f40, accent: 0x9af6b9, string: 0xe4ffe8, scale: 1.12, curve: 0.14, motif: "marsh" },
  infernoheart: { limb: 0x7d3524, accent: 0xff6a1d, string: 0xffdfb0, scale: 1.18, curve: 0.12, motif: "ember" },
  starpiercer: { limb: 0x514f86, accent: 0xcdb7ff, string: 0xf4efff, scale: 1.2, curve: 0.18, motif: "star" },
  "hallmarked-bow": { limb: 0x6d5139, accent: 0xffd166, string: 0xfff0c6, scale: 1.15, curve: 0.12, motif: "master" },
  windrunner: { limb: 0x8a7b45, accent: 0xd8f7a3, string: 0xfbffd8, scale: 1.08, curve: 0.2, motif: "frontier" },
  kingmaker: { limb: 0x6d4a32, accent: 0xffd166, string: 0xfff1c7, scale: 1.22, curve: 0.09, motif: "crown" },
  voidstar: { limb: 0x302c59, accent: 0x8c6dff, string: 0xefe9ff, scale: 1.26, curve: 0.2, motif: "void" },
  whisperbranch: { limb: 0x4d6b45, accent: 0x9af6b9, string: 0xf0ffe8, scale: 1.12, curve: 0.24, motif: "branch" },
};

export const OUTFIT_VISUALS = {
  starter: { torso: 0x263f36, cape: 0x172922, trim: 0xe6b75d, leather: 0x7b4e2f },
  hunter: { torso: 0x2f4d38, cape: 0x1e3328, trim: 0x8fd18a, leather: 0x6a4328 },
  explorer: { torso: 0x51613e, cape: 0x37462f, trim: 0xd8c179, leather: 0x8b5a35 },
  guildRanger: { torso: 0x314b55, cape: 0x21363e, trim: 0xe6b75d, leather: 0x725136 },
  ancientArcher: { torso: 0x4b4267, cape: 0x302842, trim: 0xc79cff, leather: 0x6f5a46 },
  masterArcher: { torso: 0x35515f, cape: 0x1f2f38, trim: 0xffd166, leather: 0x7d5134 },
};

export const WEAPON_VISUALS = {
  "wooden-sword": { color: 0x9a6237, accent: 0xd6a456, scale: 0.92 },
  "short-blade": { color: 0x9ca7a8, accent: 0xe6b75d, scale: 0.82 },
  "forest-spear": { color: 0x7d5a34, accent: 0x8fd18a, scale: 1.08 },
};

export const SHIELD_VISUALS = {
  "wooden-shield": { color: 0x7b4e2f, accent: 0xd6a456, scale: 0.92 },
  "reinforced-shield": { color: 0x5f5547, accent: 0xe6b75d, scale: 1.02 },
};

export function getBowVisual(id = "starter-bow") {
  return BOW_VISUALS[id] ?? BOW_VISUALS["starter-bow"];
}

export function getOutfitVisual(setId = "starter") {
  return OUTFIT_VISUALS[setId] ?? OUTFIT_VISUALS.starter;
}
