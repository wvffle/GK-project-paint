import type { ToolHandler } from '~/composables/tools'
import type { Drawable } from '~/composables/canvas'
import type { Point } from '~/types'

import { addDrawable, defineDrawableImplementation, removeDrawable } from '~/composables/canvas'
import { pivot } from '~/composables/tools'

import { x, y } from '~/composables/mouse'
import Icon from '~icons/lucide/hexagon'

class Ngon implements Drawable {
  tx = 0
  ty = 0
  ts = 1
  tr = 0

  points: Point[] = []
  isClosed = false

  applyTransform() {
    for (const point of this.points) {
      const t = this.transformPoint(point)
      point[0] = t[0]
      point[1] = t[1]
    }

    this.tx = 0
    this.ty = 0
    this.ts = 1
    this.tr = 0
  }

  transformPoint = (point: Point): Point => {
    const translated: Point = [
      parseFloat(point[0]) + this.tx,
      parseFloat(point[1]) + this.ty,
    ]

    const scaled: Point = [
      pivot[0] + (translated[0] - pivot[0]) * this.ts,
      pivot[1] + (translated[1] - pivot[1]) * this.ts,
    ]

    const rotated: Point = [
      pivot[0] + (scaled[0] - pivot[0]) * Math.cos(this.tr) - (scaled[1] - pivot[1]) * Math.sin(this.tr),
      pivot[1] + (scaled[1] - pivot[1]) * Math.cos(this.tr) + (scaled[0] - pivot[0]) * Math.sin(this.tr),
    ]

    return rotated
  }

  get path() {
    const path = new Path2D()

    if (this.points.length === 0)
      return path

    path.moveTo(...this.transformPoint(this.points[0]))
    for (const point of this.points.slice(1))
      path.lineTo(...this.transformPoint(point))

    if (this.isClosed)
      path.closePath()

    return path
  }

  get center(): Point {
    return pivot
  }

  readonly fields = {
    points: 'points',
    isClosed: 'boolean',
  } as const
}

defineDrawableImplementation(Ngon)

export default (): ToolHandler<Ngon> => ({
  category: 'draw',
  icon: markRaw(Icon),

  mousemove() {},

  mousedown() {
    if (!this.current) {
      const ngon = new Ngon()
      ngon.points.push([x.value, y.value])
      this.current = ngon
      addDrawable(ngon)
      return
    }

    if (!this.current.isClosed) {
      const [sx, sy] = this.current.points[0]
      const mx = x.value
      const my = y.value

      if (mx >= sx - 10 && mx <= sx + 10 && my >= sy - 10 && my <= sy + 10) {
        console.log('!', 'closing')
        this.current.isClosed = true
        return
      }

      this.current.points.push([x.value, y.value])
    }
  },

  mouseup() {
    const ngon = this.current

    if (ngon?.isClosed)
      this.reset(false)

    return ngon?.isClosed ?? true
  },

  reset(remove = true) {
    if (remove && this.current)
      removeDrawable(this.current)

    this.current = undefined
  },
})
