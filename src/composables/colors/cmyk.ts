export const cmyk2rgb = (c: number, m: number, y: number, k: number) => [
  255 - Math.min(1, c * (1 - k) + k) * 255,
  255 - Math.min(1, m * (1 - k) + k) * 255,
  255 - Math.min(1, y * (1 - k) + k) * 255,
] as const
