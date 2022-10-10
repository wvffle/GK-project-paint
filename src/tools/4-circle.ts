import type { ToolHandler } from '~/composables/tools'
import type { Drawable } from '~/composables/canvas'

import { addDrawable, context, removeDrawable } from '~/composables/canvas'
import { x, y } from '~/composables/mouse'
import Icon from '~icons/lucide/circle'

class Circle implements Drawable {
  cx = 0
  cy = 0
  r = 0

  draw() {
    const ctx = context.value
    ctx.beginPath()
    ctx.arc(this.cx, this.cy, this.r, 0, Math.PI * 2)
    ctx.closePath()
    ctx.stroke()
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
