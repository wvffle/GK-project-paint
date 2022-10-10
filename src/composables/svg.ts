export const createElement = (qualifiedName: keyof SVGElementTagNameMap) => document.createElementNS('http://www.w3.org/2000/svg', qualifiedName)

export const svg = ref<SVGElement>()

export const appendElement = (element: SVGElement) => {
  svg.value?.appendChild(element)
}

export const removeElement = (element: SVGElement) => {
  svg.value?.removeChild(element)
}
