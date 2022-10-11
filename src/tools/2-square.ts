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

  readonly fields = {
    x: 'number',
    y: 'number',
    width: 'number',
    height: 'number',
  } as const
}

const xy = { x: -1, y: -1 }

export default (): ToolHandler<Rect> => ({
  category: 'draw',
  icon: Icon,

  mousemove() {
    if (!this.current)
      return

    const dx = x.value - xy.x
    const dy = y.value - xy.y

    this.current.x = dx < 0 ? x.value : xy.x
    this.current.y = dy < 0 ? y.value : xy.y

    this.current.width = Math.abs(dx)
    this.current.height = Math.abs(dy)
  },

  mousedown() {
    const rect = new Rect()
    rect.x = x.value
    rect.y = y.value

    rect.width = 0
    rect.height = 0

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
