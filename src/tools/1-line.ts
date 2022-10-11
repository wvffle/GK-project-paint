import type { ToolHandler } from '~/composables/tools'
import type { Drawable } from '~/composables/canvas'

import { addDrawable, removeDrawable } from '~/composables/canvas'
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

    if (this.ts !== 1) {
      const length = distanceBetweenPoints(this.x1, this.x2, this.y1, this.y2)
      const d = (length * this.ts - length) / 2
      path.moveTo(
        this.x1 - d * (this.x2 - this.x1) / length,
        this.y1 - d * (this.y2 - this.y1) / length,
      )
      path.lineTo(
        this.x2 + d * (this.x2 - this.x1) / length,
        this.y2 + d * (this.y2 - this.y1) / length,
      )
    }
    else {
      path.moveTo(this.x1 + this.tx, this.y1 + this.ty)
      path.lineTo(this.x2 + this.tx, this.y2 + this.ty)
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
}

let current: Line | undefined

export default (): ToolHandler => ({
  category: 'draw',
  icon: Icon,

  mousemove() {
    if (!current)
      return

    current.x2 = x.value
    current.y2 = y.value
  },

  mousedown() {
    const line = new Line()
    line.x1 = x.value
    line.y1 = y.value
    line.x2 = x.value
    line.y2 = y.value

    current = line
    addDrawable(line)
  },

  mouseup() {
    this.mousemove()
    this.reset(false)
  },

  reset(remove = true) {
    if (remove && current)
      removeDrawable(current)

    current = undefined
  },
})
