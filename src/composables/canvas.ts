import { x, y } from './mouse'
import { parsePPM, parsePPMHeader } from './ppm'

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

export const scale = ref(1)
export const panning = ref(false)
const panned = {
  x: 0,
  y: 0,
  lastX: 0,
  lastY: 0,
}

whenever(panning, () => {
  panned.lastX = x.value - panned.x
  panned.lastY = y.value - panned.y
})

export const pan = () => {
  if (!panning.value)
    return

  panned.x = x.value - panned.lastX
  panned.y = y.value - panned.lastY
}

const ppms: PPM[] = []
export const drawables = new Set<Drawable>()

export const addDrawable = (drawable: Drawable) => {
  drawables.add(drawable)
}

export const removeDrawable = (drawable: Drawable) => {
  drawables.delete(drawable)
}

useResizeObserver(canvas, ([{ contentRect }]) => {
  const { width, height } = contentRect
  canvas.value.width = width
  canvas.value.height = height
})

useRafFn(() => {
  const ctx = context.value
  if (!ctx)
    return

  canvas.value.width += 0

  ctx.translate(panned.x, panned.y)

  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.value.width, canvas.value.height)
  ctx.fillStyle = '#000'

  ctx.lineWidth = 3
  for (const drawable of drawables)
    ctx.stroke(drawable.path)

  ctx.scale(scale.value, scale.value)
  for (const ppm of ppms)
    ctx.drawImage(ppm.canvas, 0, 0)
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

async function importFile(accept: string, asText?: true): Promise<string>
async function importFile(accept: string, asText: false): Promise<ArrayBuffer>
async function importFile(accept = '*', asText = true) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = accept
  input.click()

  await new Promise<void>((resolve) => {
    input.onchange = () => resolve()
  })

  if (!input.files)
    return

  const file = input.files[0]

  if (asText)
    return file.text()

  return file.arrayBuffer()
}

export const upload = async () => {
  const content = await importFile('.json')

  drawables.clear()
  for (const drawable of JSON.parse(content).map(deserialize))
    drawables.add(drawable)
}

class PPM {
  canvas = document.createElement('canvas')

  constructor(imageData: ImageData) {
    this.canvas.height = imageData.height
    this.canvas.width = imageData.width
    this.canvas.getContext('2d')
      ?.putImageData(imageData, 0, 0)
  }
}

export const importPPM = async () => {
  const content = await importFile('.ppm', false)
  console.time('Parsing header')
  const { width, height } = parsePPMHeader(content)
  console.timeEnd('Parsing header')

  console.time('Reading data')
  const data = await parsePPM(content)
  console.timeEnd('Reading data')
  console.time('Writing data')
  const imageData = context.value.createImageData(width, height)

  for (let i = 0; i < imageData.data.length; i++)
    imageData.data[i] = 255

  let counter = 0
  for (let i = 0; i < data.length; i++) {
    imageData.data[counter++] = data[i]

    if (i % 3 === 2)
      counter += 1
  }

  console.timeEnd('Writing data')

  ppms.push(new PPM(imageData))
}

export const importJPEG = async () => {
  const buffer = await importFile('image/jpeg', false)
  const data = new Uint8ClampedArray(buffer)
  const blob = new Blob([data], { type: 'image/jpeg' })

  const image = new Image()
  image.src = URL.createObjectURL(blob)

  await new Promise<void>(resolve => image.onload = () => resolve())

  context.value.drawImage(image, 0, 0)
  const imageData = context.value.getImageData(0, 0, image.width, image.height)
  ppms.push(new PPM(imageData))
}

export const exportJPEG = async () => {
  const link = document.createElement('a')

  link.download = 'picture.jpeg'
  // eslint-disable-next-line no-alert
  link.href = canvas.value.toDataURL('image/jpeg', prompt('Quality level: [0.0 - 1.0]'))
  link.dataset.downloadurl = ['image/jpeg', link.download, link.href].join(':')

  link.click()
  link.remove()
}

export const rgb = reactive({ r: 0, g: 0, b: 0 })
export const pick = () => {
  const imageData = context.value.getImageData(x.value, y.value, 1, 1)
  const [r, g, b] = imageData.data
  rgb.r = r
  rgb.g = g
  rgb.b = b
}
