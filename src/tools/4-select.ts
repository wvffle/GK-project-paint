import type { ToolHandler } from '~/composables/tools'
import type { Drawable } from '~/composables/canvas'

import { context, cursor, drawables } from '~/composables/canvas'
import { x, y } from '~/composables/mouse'
import Icon from '~icons/lucide/pointer'

let hovered: Drawable | undefined

export default (): ToolHandler<Drawable> => ({
  category: 'transform',
  icon: markRaw(Icon),

  mousemove() {
    const ctx = context.value
    if (!ctx)
      return

    const mx = x.value
    const my = y.value

    cursor.value = undefined
    hovered = undefined
    for (const drawable of drawables) {
      if (ctx.isPointInStroke(drawable.path, mx, my)) {
        cursor.value = 'pointer'
        hovered = drawable
        break
      }
    }
  },

  mousedown() {
    if (!hovered)
      return

    this.current = hovered
  },

  mouseup() {
  },

  reset(cancelTransformation = true) {
    if (!cancelTransformation)
      this.current?.applyTransform()

    this.current = undefined
  },
})
