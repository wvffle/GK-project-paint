export const hsv2rgb = (h: number, s: number, v: number) => {
  const f = (n: number, k = (n + h / Math.PI * 3) % 6) => (v - v * s * Math.max(Math.min(k, 4 - k, 1), 0)) * 255
  return [f(5), f(3), f(1)] as const
}
