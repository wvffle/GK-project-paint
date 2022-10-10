export const canvas = ref()
export const context = computed<CanvasRenderingContext2D>(() => canvas.value?.getContext('2d'))

export interface Drawable {
  draw(): void
}

export const drawables = new Set<Drawable>()

export const addDrawable = (drawable: Drawable) => {
  drawables.add(drawable)
}

export const removeDrawable = (drawable: Drawable) => {
  drawables.delete(drawable)
}

watchOnce(canvas, (canvas) => {
  canvas.width = window.innerWidth - 301
  canvas.height = window.innerHeight
})

useRafFn(() => {
  if (!context.value)
    return

  canvas.value.width += 0

  for (const drawable of drawables)
    drawable.draw()
}, { immediate: true })
