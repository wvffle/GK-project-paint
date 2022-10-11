import type { ToolHandler } from '~/composables/tools'
import type { Drawable } from '~/composables/canvas'
import { addDrawable, defineDrawableImplementation, removeDrawable } from '~/composables/canvas'

import { x, y } from '~/composables/mouse'
import Icon from '~icons/lucide/circle'
import { distanceBetweenPoints } from '~/composables/maths'

class Circle implements Drawable {
  cx = 0
  cy = 0
  r = 0

  tx = 0
  ty = 0
  ts = 1

  applyTransform() {
    this.cx += this.tx
    this.cy += this.ty
    this.r *= this.ts
    this.tx = 0
    this.ty = 0
    this.ts = 1
  }

  get path() {
    const path = new Path2D()
    path.arc(
      this.cx + this.tx,
      this.cy + this.ty,
      this.r * this.ts,
      0,
      Math.PI * 2,
    )
    path.closePath()
    return path
  }

  get center(): [number, number] {
    return [
      this.cx,
      this.cy,
    ]
  }

  readonly fields = {
    cx: 'number',
    cy: 'number',
    r: 'number',
  } as const
}

defineDrawableImplementation(Circle)

const xy = { x: -1, y: -1 }

export default (): ToolHandler<Circle> => ({
  category: 'draw',
  icon: Icon,

  mousemove() {
    if (!this.current)
      return

    this.current.r = distanceBetweenPoints(xy.x, xy.y, x.value, y.value)
  },

  mousedown() {
    const rect = new Circle()
    rect.cx = x.value
    rect.cy = y.value
    rect.r = 0

    xy.x = x.value
    xy.y = y.value

    this.current = rect
    addDrawable(rect)
  },

  mouseup() {
    this.mousemove()
    this.reset(false)
  },

  reset(remove = true) {
    if (remove && this.current)
      removeDrawable(this.current)

    this.current = undefined
    xy.x = -1
    xy.y = -1
  },
})
