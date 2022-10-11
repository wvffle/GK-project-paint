export const canvas = ref()
export const context = computed<CanvasRenderingContext2D>(() => canvas.value?.getContext('2d'))

export interface Drawable {
  readonly fields: Record<string, 'string' | 'number'>
  readonly path: Path2D
  readonly center: [number, number]
  tx: number
  ty: number
  ts: number
  applyTransform(): void

}

export const cursor = ref<string>()

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
  const ctx = context.value
  if (!ctx)
    return

  canvas.value.width += 0

  ctx.lineWidth = 3
  for (const drawable of drawables)
    ctx.stroke(drawable.path)
}, { immediate: true })
