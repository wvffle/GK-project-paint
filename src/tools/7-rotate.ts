import type { ToolHandler } from '~/composables/tools'
import type { Drawable } from '~/composables/canvas'
import type { Point } from '~/types'

import { context, cursor, drawables } from '~/composables/canvas'
import { x, y } from '~/composables/mouse'
import Icon from '~icons/lucide/rotate-cw'
import { angleBetweenPoints } from '~/composables/maths'

let hovered: Drawable | undefined
const xy: Point = [0, 0]

export default (): ToolHandler<Drawable> => ({
  category: 'transform',
  icon: markRaw(Icon),

  mousemove() {
    if (this.current) {
      this.current.tr = angleBetweenPoints(xy, [x.value, y.value])
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

    this.current = hovered
    xy[0] = x.value
    xy[1] = y.value
  },

  mouseup() {
    this.reset(false)
    this.mousemove()
  },

  reset(cancelTransformation = true) {
    if (!cancelTransformation)
      this.current?.applyTransform()

    this.current = undefined
    xy[0] = 0
    xy[1] = 0
  },
})
