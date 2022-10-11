import type { ToolHandler } from '~/composables/tools'
import type { Drawable } from '~/composables/canvas'

import { addDrawable, removeDrawable } from '~/composables/canvas'
import { x, y } from '~/composables/mouse'
import Icon from '~icons/lucide/circle'

class Circle implements Drawable {
  cx = 0
  cy = 0
  r = 0

  tx = 0
  ty = 0

  applyTransform() {
    this.cx += this.tx
    this.cy += this.ty
    this.tx = 0
    this.ty = 0
  }

  get path() {
    const path = new Path2D()
    path.arc(
      this.cx + this.tx,
      this.cy + this.ty,
      this.r,
      0,
      Math.PI * 2,
    )
    path.closePath()
    return path
  }
}

let current: Circle | undefined
const xy = { x: -1, y: -1 }

export default (): ToolHandler => ({
  icon: Icon,

  mousemove() {
    if (!current)
      return

    current.r = Math.sqrt((x.value - xy.x) ** 2 + (y.value - xy.y) ** 2)
  },

  mousedown() {
    const rect = new Circle()
    rect.cx = x.value
    rect.cy = y.value
    rect.r = 0

    xy.x = x.value
    xy.y = y.value

    current = rect
    addDrawable(rect)
  },

  mouseup() {
    this.mousemove()
    this.reset(false)
  },

  reset(remove = true) {
    if (remove && current)
      removeDrawable(current)

    current = undefined
    xy.x = -1
    xy.y = -1
  },
})
