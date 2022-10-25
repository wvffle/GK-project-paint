export const rgb2hsv = (r: number, g: number, b: number) => {
  const v = Math.max(r, g, b); const c = v - Math.min(r, g, b)
  const h = c && ((v === r) ? (g - b) / c : ((v === g) ? 2 + (b - r) / c : 4 + (r - g) / c))
  return [(h < 0 ? h + 6 : h) / 3 * Math.PI, v && c / v, v / 0xFF] as const
}

export const rgb2cmyk = (r: number, g: number, b: number) => {
  if (r === 0 && g === 0 && b === 0)
    return [0, 0, 0, 1]

  const c = 1 - r / 255
  const m = 1 - g / 255
  const y = 1 - b / 255
  const k = Math.min(c, m, y)

  return [
    (c - k) / (1 - k),
    (m - k) / (1 - k),
    (y - k) / (1 - k),
    k,
  ] as const
}
