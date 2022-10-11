import type { ToolHandler } from '~/composables/tools'
import type { Drawable } from '~/composables/canvas'
import { addDrawable, defineDrawableImplementation, removeDrawable } from '~/composables/canvas'

import { x, y } from '~/composables/mouse'
import Icon from '~icons/lucide/edit-3'
import { distanceBetweenPoints } from '~/composables/maths'

class Line implements Drawable {
  x1 = 0
  y1 = 0
  x2 = 0
  y2 = 0

  tx = 0
  ty = 0
  ts = 1

  applyTransform() {
    this.x1 += this.tx
    this.y1 += this.ty
    this.x2 += this.tx
    this.y2 += this.ty

    if (this.ts !== 1) {
      const length = distanceBetweenPoints(this.x1, this.x2, this.y1, this.y2)
      const d = (length * this.ts - length) / 2
      this.x1 -= d * (this.x2 - this.x1) / length
      this.y1 -= d * (this.y2 - this.y1) / length
      this.x2 += d * (this.x2 - this.x1) / length
      this.y2 += d * (this.y2 - this.y1) / length
    }

    this.tx = 0
    this.ty = 0
    this.ts = 1
  }

  get path() {
    const path = new Path2D()

    const x1 = this.x1 + this.tx
    const y1 = this.y1 + this.ty
    const x2 = this.x2 + this.tx
    const y2 = this.y2 + this.ty

    if (this.ts !== 1) {
      const length = distanceBetweenPoints(x1, x2, y1, y2)
      const d = (length * this.ts - length) / 2
      path.moveTo(
        x1 - d * (x2 - x1) / length,
        y1 - d * (y2 - y1) / length,
      )
      path.lineTo(
        x2 + d * (x2 - x1) / length,
        y2 + d * (y2 - y1) / length,
      )
    }
    else {
      path.moveTo(x1 + this.tx, y1 + this.ty)
      path.lineTo(x2 + this.tx, y2 + this.ty)
    }

    path.closePath()
    return path
  }

  get center(): [number, number] {
    return [
      (this.x1 + this.x2) / 2,
      (this.y1 + this.y2) / 2,
    ]
  }

  readonly fields = {
    x1: 'number',
    y1: 'number',
    x2: 'number',
    y2: 'number',
  } as const
}

defineDrawableImplementation(Line)

export default (): ToolHandler<Line> => ({
  category: 'draw',
  icon: Icon,

  mousemove() {
    if (!this.current)
      return

    this.current.x2 = x.value
    this.current.y2 = y.value
  },

  mousedown() {
    const line = new Line()
    line.x1 = x.value
    line.y1 = y.value
    line.x2 = x.value
    line.y2 = y.value

    this.current = line
    addDrawable(line)
  },

  mouseup() {
    this.mousemove()
    this.reset(false)
  },

  reset(remove = true) {
    if (remove && this.current)
      removeDrawable(this.current)

    this.current = undefined
  },
})
