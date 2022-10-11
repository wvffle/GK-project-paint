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

interface SerializedDrawable {
  __type__: string
  [key: string]: any
}

const drawableImplementations = new Map<string, any>()
export const defineDrawableImplementation = (impl: any) => drawableImplementations.set(impl.name, impl)

const serialize = (drawable: Drawable) => {
  const data: SerializedDrawable = {
    __type__: drawable.constructor.name,
  }

  for (const field in drawable.fields)
    data[field] = drawable[field as keyof typeof drawable]

  return data
}

const deserialize = (serialized: SerializedDrawable): Drawable => {
  const Implementation = drawableImplementations.get(serialized.__type__)

  const drawable = new Implementation()
  for (const key in serialized) {
    if (key !== '__type__')
      drawable[key] = serialized[key]
  }

  return drawable
}

export const download = () => {
  const blob = new Blob([JSON.stringify([...drawables].map(serialize))], { type: 'text/json' })
  const link = document.createElement('a')

  link.download = 'picture.json'
  link.href = window.URL.createObjectURL(blob)
  link.dataset.downloadurl = ['text/json', link.download, link.href].join(':')

  link.click()
  link.remove()
}

export const upload = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.click()
  input.onchange = () => {
    if (!input.files)
      return

    const file = input.files[0]
    const reader = new FileReader()
    reader.readAsText(file)
    reader.onload = () => {
      drawables.clear()
      for (const drawable of JSON.parse(reader.result as string).map(deserialize))
        drawables.add(drawable)
    }
  }
}
