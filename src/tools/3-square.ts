import type { ToolHandler } from '~/composables/tools'
import type { Drawable } from '~/composables/canvas'

import { addDrawable, context, removeDrawable } from '~/composables/canvas'
import { x, y } from '~/composables/mouse'
import Icon from '~icons/lucide/square'

class Rect implements Drawable {
  x = 0
  y = 0
  width = 0
  height = 0

  draw() {
    const ctx = context.value
    ctx.beginPath()
    ctx.moveTo(this.x, this.y)
    ctx.lineTo(this.x + this.width, this.y)
    ctx.lineTo(this.x + this.width, this.y + this.height)
    ctx.lineTo(this.x, this.y + this.height)
    ctx.closePath()
    ctx.stroke()
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
