import type { ToolHandler } from '~/composables/tools'
import type { Drawable } from '~/composables/canvas'

import { context, cursor, drawables } from '~/composables/canvas'
import { x, y } from '~/composables/mouse'
import Icon from '~icons/lucide/grab'

let hovered: Drawable | undefined
let current: Drawable | undefined
const xy = { x: 0, y: 0 }

export default (): ToolHandler => ({
  category: 'transform',
  icon: Icon,

  mousemove() {
    if (current) {
      current.tx = x.value - xy.x
      current.ty = y.value - xy.y
      return
    }

    const ctx = context.value
    if (!ctx)
      return

    const mx = x.value
    const my = y.value

    cursor.value = undefined
    hovered = undefined
    for (const drawable of drawables) {
      if (ctx.isPointInStroke(drawable.path, mx, my)) {
        cursor.value = 'grab'
        hovered = drawable
        break
      }
    }
  },

  mousedown() {
    if (!hovered)
      return

    current = hovered
    xy.x = x.value
    xy.y = y.value
  },

  mouseup() {
    this.reset(false)
    this.mousemove()
  },

  reset(cancelTransformation = true) {
    if (!cancelTransformation)
      current?.applyTransform()

    current = undefined
    xy.x = 0
    xy.y = 0
  },
})
