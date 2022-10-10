import type { ToolHandler } from '~/composables/tools'

import { appendElement, createElement, removeElement } from '~/composables/svg'
import { x, y } from '~/composables/mouse'
import Icon from '~icons/lucide/edit-3'

type SVGElementType = SVGLineElement

const current = ref<SVGElementType>()

export default (): ToolHandler => ({
  icon: Icon,

  mousemove() {
    const line = current.value
    if (!line)
      return

    line.setAttribute('x2', x.value.toString())
    line.setAttribute('y2', y.value.toString())
  },

  mousedown() {
    const line = createElement('line') as SVGElementType
    line.setAttribute('x1', x.value.toString())
    line.setAttribute('y1', y.value.toString())
    line.setAttribute('x2', x.value.toString())
    line.setAttribute('y2', y.value.toString())

    current.value = line
    appendElement(line)
  },

  mouseup() {
    const line = current.value
    if (!line)
      return

    this.mousemove()
    this.reset(false)
  },

  reset(remove = true) {
    if (remove && current.value)
      removeElement(current.value)

    current.value = undefined
  },
})
