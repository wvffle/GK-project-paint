export const mouseTarget = ref()
export const { elementX: x, elementY: y } = useMouseInElement(mouseTarget, { type: 'page' })
