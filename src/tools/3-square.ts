import type { ToolHandler } from '~/composables/tools'
import type { Drawable } from '~/composables/canvas'

import { addDrawable, removeDrawable } from '~/composables/canvas'
import { x, y } from '~/composables/mouse'
import Icon from '~icons/lucide/square'

class Rect implements Drawable {
  x = 0
  y = 0
  width = 0
  height = 0

  tx = 0
  ty = 0

  applyTransform() {
    this.x += this.tx
    this.y += this.ty
    this.tx = 0
    this.ty = 0
  }

  get path() {
    const path = new Path2D()
    path.rect(
      this.x + this.tx,
      this.y + this.ty,
      this.width,
      this.height,
    )
    path.closePath()
    return path
  }
}

let current: Rect | undefined
const xy = { x: -1, y: -1 }

export default (): ToolHandler => ({
  icon: Icon,

  mousemove() {
    if (!current)
      return

    const dx = x.value - xy.x
    const dy = y.value - xy.y

    current.x = dx < 0 ? x.value : xy.x
    current.y = dy < 0 ? y.value : xy.y

    current.width = Math.abs(dx)
    current.height = Math.abs(dy)
  },

  mousedown() {
    const rect = new Rect()
    rect.x = x.value
    rect.y = y.value

    rect.width = 0
    rect.height = 0

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
