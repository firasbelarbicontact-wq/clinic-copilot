const PALETTES = [
  'bg-gradient-to-br from-teal-500 to-cyan-500',
  'bg-gradient-to-br from-indigo-500 to-sky-500',
  'bg-gradient-to-br from-emerald-500 to-teal-500',
  'bg-gradient-to-br from-rose-500 to-orange-400',
  'bg-gradient-to-br from-violet-500 to-fuchsia-500',
];

/** Une couleur stable pour un nom donné. */
export function avatarGradient(key: string): string {
  let s = 0;
  for (const c of key) s += c.charCodeAt(0);
  return PALETTES[s % PALETTES.length];
}