import type { ToolHandler } from '~/composables/tools'
import type { Drawable } from '~/composables/canvas'

import { context, cursor, drawables } from '~/composables/canvas'
import { x, y } from '~/composables/mouse'
import Icon from '~icons/lucide/maximize-2'
import { distanceBetweenPoints } from '~/composables/maths'

let hovered: Drawable | undefined
let current: Drawable | undefined
const xy = { x: 0, y: 0, r: 0 }

export default (): ToolHandler => ({
  category: 'transform',
  icon: Icon,

  mousemove() {
    if (current) {
      const r = distanceBetweenPoints(...current.center, x.value, y.value)
      current.ts = r / xy.r
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
        cursor.value = 'sw-resize'
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
    xy.r = distanceBetweenPoints(...current.center, xy.x, xy.y)
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
    xy.r = 0
  },
})
