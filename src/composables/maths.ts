import { pivot } from './tools'
import type { Point } from '~/types'

export const distanceBetweenPoints = (x1: number, y1: number, x2: number, y2: number) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
export const angleBetweenPoints = (p1: Point, p2: Point) => {
  return Math.atan2(p2[1] - pivot[1], p2[0] - pivot[0])
       - Math.atan2(p1[1] - pivot[1], p1[0] - pivot[0])
}
