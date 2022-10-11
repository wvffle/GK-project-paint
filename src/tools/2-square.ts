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
  ts = 1

  applyTransform() {
    const sw = this.width * this.ts
    const sh = this.height * this.ts

    this.x += this.tx + this.width / 2 - sw / 2
    this.y += this.ty + this.height / 2 - sh / 2
    this.width = sw
    this.height = sh
    this.tx = 0
    this.ty = 0
    this.ts = 1
  }

  get path() {
    const path = new Path2D()

    const sw = this.width * this.ts
    const sh = this.height * this.ts

    path.rect(
      this.x + this.tx + this.width / 2 - sw / 2,
      this.y + this.ty + this.height / 2 - sh / 2,
      sw,
      sh,
    )
    path.closePath()
    return path
  }

  get center(): [number, number] {
    return [
      this.x + this.width / 2,
      this.y + this.height / 2,
    ]
  }
}

let current: Rect | undefined
const xy = { x: -1, y: -1 }

export default (): ToolHandler => ({
  category: 'draw',
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
