import type { ToolHandler } from '~/composables/tools'
import type { Drawable } from '~/composables/canvas'

import { addDrawable, context, removeDrawable } from '~/composables/canvas'
import { x, y } from '~/composables/mouse'
import Icon from '~icons/lucide/edit-3'

class Line implements Drawable {
  x1 = 0
  y1 = 0
  x2 = 0
  y2 = 0

  draw() {
    const ctx = context.value
    ctx.beginPath()
    ctx.moveTo(this.x1, this.y1)
    ctx.lineTo(this.x2, this.y2)
    ctx.closePath()
    ctx.stroke()
  }
}

let current: Line | undefined

export default (): ToolHandler => ({
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
