import type { ToolHandler } from '~/composables/tools'

import { x, y } from '~/composables/mouse'
import Icon from '~icons/lucide/pointer'

export default (): ToolHandler => ({
  icon: Icon,

  mousemove() {
    console.log(x.value, y.value)
  },

  mousedown() {
  },

  mouseup() {
  },

  reset(_remove = true) {
  },
})
