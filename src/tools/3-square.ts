import type { ToolHandler } from '~/composables/tools'

import { appendElement, createElement, removeElement } from '~/composables/svg'
import { x, y } from '~/composables/mouse'
import Icon from '~icons/lucide/square'

type SVGElementType = SVGRectElement

const current = ref<SVGElementType>()
const xy = reactive({
  x: -1,
  y: -1,
})

export default (): ToolHandler => ({
  icon: Icon,

  mousemove() {
    const rect = current.value
    if (!rect)
      return

    const dx = x.value - xy.x
    const dy = y.value - xy.y

    rect.setAttribute('x', dx < 0 ? `${x.value}` : `${xy.x}`)
    rect.setAttribute('y', dy < 0 ? `${y.value}` : `${xy.y}`)

    rect.setAttribute('width', `${Math.abs(dx)}`)
    rect.setAttribute('height', `${Math.abs(dy)}`)
  },

  mousedown() {
    const rect = createElement('rect') as SVGElementType
    rect.setAttribute('x', x.value.toString())
    rect.setAttribute('y', y.value.toString())
    rect.setAttribute('width', '0')
    rect.setAttribute('height', '0')

    xy.x = x.value
    xy.y = y.value

    current.value = rect
    appendElement(rect)
  },

  mouseup() {
    const rect = current.value
    if (!rect)
      return

    this.mousemove()
    this.reset(false)
  },

  reset(remove = true) {
    if (remove && current.value)
      removeElement(current.value)

    current.value = undefined
    xy.x = -1
    xy.y = -1
  },
})
