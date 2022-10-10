import type { ToolHandler } from '~/composables/tools'

import { appendElement, createElement, removeElement } from '~/composables/svg'
import { x, y } from '~/composables/mouse'
import Icon from '~icons/lucide/circle'

type SVGElementType = SVGCircleElement

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

    const r = Math.sqrt((x.value - xy.x) ** 2 + (y.value - xy.y) ** 2)

    rect.setAttribute('r', `${r}`)
  },

  mousedown() {
    const rect = createElement('circle') as SVGElementType
    rect.setAttribute('cx', x.value.toString())
    rect.setAttribute('cy', y.value.toString())
    rect.setAttribute('r', '0')

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
