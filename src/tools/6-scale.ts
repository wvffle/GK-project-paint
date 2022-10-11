import type { ToolHandler } from '~/composables/tools'
import type { Drawable } from '~/composables/canvas'

import { context, cursor, drawables } from '~/composables/canvas'
import { x, y } from '~/composables/mouse'
import Icon from '~icons/lucide/maximize-2'
import { distanceBetweenPoints } from '~/composables/maths'

let hovered: Drawable | undefined
const xy = { x: 0, y: 0, r: 0 }

export default (): ToolHandler<Drawable> => ({
  category: 'transform',
  icon: Icon,

  mousemove() {
    if (this.current) {
      const r = distanceBetweenPoints(...this.current.center, x.value, y.value)
      this.current.ts = r / xy.r
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

    this.current = hovered
    xy.x = x.value
    xy.y = y.value
    xy.r = distanceBetweenPoints(...this.current.center, xy.x, xy.y)
  },

  mouseup() {
    this.reset(false)
    this.mousemove()
  },

  reset(cancelTransformation = true) {
    if (!cancelTransformation)
      this.current?.applyTransform()

    this.current = undefined
    xy.x = 0
    xy.y = 0
    xy.r = 0
  },
})
