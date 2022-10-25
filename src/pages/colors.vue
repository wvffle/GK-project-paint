<script setup lang="ts">
import { Color, LinearFilter, NearestFilter, OrthographicCamera, Scene, WebGL1Renderer, WebGLRenderTarget } from 'three'
// @ts-expect-error No typings
import { OrbitControls } from 'three/addons/controls/OrbitControls'
import { createCone, createCursor } from '~/composables/three/hsv-cone'
import { rgb2cmyk, rgb2hsv } from '~/composables/colors/rgb'
import { cmyk2rgb } from '~/composables/colors/cmyk'
import { hsv2rgb } from '~/composables/colors/hsv'

// CMYK
const c = ref(1)
const m = ref(1 / 3)
const y = ref(0)
const k = ref(0)

const lastCMY = { c: c.value, m: m.value, y: y.value }
watch(k, (to, from) => {
  if (to === 1 || from === 1) {
    c.value = lastCMY.c
    m.value = lastCMY.m
    y.value = lastCMY.y
  }
})

watch(c, (to) => {
  if (k.value !== 1)
    lastCMY.c = to
})

watch(m, (to) => {
  if (k.value !== 1)
    lastCMY.m = to
})

watch(y, (to) => {
  if (k.value !== 1)
    lastCMY.y = to
})

// RGB
const rgb = computed(() => cmyk2rgb(c.value, m.value, y.value, k.value))

const r = computed({
  get: () => rgb.value[0],
  set: (r) => {
    const [C, M, Y, K] = rgb2cmyk(r, rgb.value[1], rgb.value[2])
    c.value = C
    m.value = M
    y.value = Y
    k.value = K
  },
})

const g = computed({
  get: () => rgb.value[1],
  set: (g) => {
    const [C, M, Y, K] = rgb2cmyk(rgb.value[0], g, rgb.value[2])
    c.value = C
    m.value = M
    y.value = Y
    k.value = K
  },
})

const b = computed({
  get: () => rgb.value[2],
  set: (b) => {
    const [C, M, Y, K] = rgb2cmyk(rgb.value[0], rgb.value[1], b)
    c.value = C
    m.value = M
    y.value = Y
    k.value = K
  },
})

// Render target
const target = new WebGLRenderTarget(window.innerWidth, window.innerHeight, {
  minFilter: LinearFilter,
  magFilter: NearestFilter,
})

// Scene
const scene = new Scene()

// Cone
const CONE_RADIUS = 0.5
const { cone, material } = createCone(CONE_RADIUS, 1, 64)
scene.add(cone)

const { cursor, material: cursorMaterial, outline, outlineMaterial } = createCursor(0.02, 32)
scene.add(cursor)
scene.add(outline)

// Camera
const d = 0.8
const offsetY = 0.5
const camera = new OrthographicCamera(-d, d, d + offsetY, -d + offsetY, 0.1, 100)

camera.position.x = 1.2247
camera.position.y = 1
camera.position.z = 1.2247

// Mouse
const renderCanvas = ref<HTMLCanvasElement>()
const { x: mx, y: my } = useMouseInElement(renderCanvas)

// Renderer
const renderer = new WebGL1Renderer()
renderer.setClearColor(0xFFFFFF)

const canvas = ref<HTMLElement>()
onMounted(() => {
  canvas.value?.appendChild(renderer.domElement)
  renderCanvas.value = renderer.domElement
})

useResizeObserver(canvas, ([entry]) => {
  renderer.setSize(entry.contentRect.width, window.innerHeight)
  target.setSize(entry.contentRect.width, window.innerHeight)
})

// Controls
const controls = new OrbitControls(camera, renderer.domElement)

// Hue, Saturation, Value
const hsv = computed(() => rgb2hsv(r.value, g.value, b.value))

const hue = computed({
  get: () => hsv.value[0],
  set: (h) => {
    const [R, G, B] = hsv2rgb(h, hsv.value[1], hsv.value[2])
    r.value = R
    g.value = G
    b.value = B
  },
})

const saturation = computed({
  get: () => hsv.value[1],
  set: (s) => {
    const [R, G, B] = hsv2rgb(hsv.value[0], s, hsv.value[2])
    r.value = R
    g.value = G
    b.value = B
  },
})

const value = computed({
  get: () => hsv.value[2],
  set: (v) => {
    const [R, G, B] = hsv2rgb(hsv.value[0], hsv.value[1], v)
    r.value = R
    g.value = G
    b.value = B
  },
})

watchEffect(() => {
  material.uniforms.phase.value = hue.value - Math.PI / 4
  cone.rotation.y = hue.value - Math.PI / 2
})

const tan = CONE_RADIUS / cone.geometry.parameters.height
watchEffect(() => {
  const z = tan * value.value * saturation.value
  cursor.position.z = cone.position.z + z
  outline.position.z = cone.position.z + z
})

const COLOR_BLACK = new Color(0x000000)
const COLOR_WHITE = new Color(0xFFFFFF)

watchEffect(() => {
  cursor.position.y = cone.geometry.parameters.height * value.value
  outline.position.y = cone.geometry.parameters.height * value.value

  outlineMaterial.color = value.value > 0.5
    ? COLOR_BLACK
    : COLOR_WHITE
})

watchEffect(() => {
  cursorMaterial.color = new Color(...rgb.value.map(value => value / 255))
})

// Rendering
useRafFn(() => {
  controls.update()
  renderer.render(scene, camera)
})

// Color picking
const pickConeColor = async () => {
  renderer.setRenderTarget(target)
  renderer.render(scene, camera)
  renderer.setRenderTarget(null)

  const data = new Uint8Array(4)
  renderer.readRenderTargetPixels(target, mx.value, target.height - my.value, 1, 1, data)

  const [r, g, b] = data
  const [h, s, v] = rgb2hsv(r, g, b)

  hue.value = h
  saturation.value = s
  value.value = v
}

const lastCoordinates = { x: 0, y: 0 }
const mousedown = () => {
  lastCoordinates.x = mx.value
  lastCoordinates.y = my.value
}

const mouseup = () => {
  const dx = Math.abs(lastCoordinates.x - mx.value)
  const dy = Math.abs(lastCoordinates.y - my.value)

  if (dx <= 5 && dy <= 5)
    pickConeColor()
}
</script>

<template>
  <div class="grid grid-cols-3">
    <div ref="canvas" @mousedown="mousedown" @mouseup="mouseup" />
    <div class="col-span-2 border-l-1 border-gray-400 p-8">
      <div class="grid grid-cols-4">
        <div>
          <div
            :style="{ backgroundColor: `rgb(${[r, g, b].join(', ')})` }"
            class="aspect-ratio-1 w-36 preview"
          />
        </div>

        <div>
          <label>Hue</label>
          <div class="flex group">
            <fw-input v-model.number="hue" class="w-16 text-center" />
            <input v-model.number="hue" type="range" min="0" max="6.28" step="any" class="ml-4">
          </div>

          <label>Saturation</label>
          <div class="flex group">
            <fw-input v-model.number="saturation" class="w-16 text-center" />
            <input v-model.number="saturation" type="range" min="0" max="1" step="any" class="ml-4">
          </div>

          <label>Value</label>
          <div class="flex group">
            <fw-input v-model.number="value" class="w-16 text-center" />
            <input v-model.number="value" type="range" min="0" max="1" step="any" class="ml-4">
          </div>
        </div>
        <div>
          <label>Red</label>
          <div class="flex group">
            <fw-input v-model.number="r" class="w-16 text-center" />
            <input v-model.number="r" type="range" min="0" max="255" step="any" class="ml-4">
          </div>

          <label>Green</label>
          <div class="flex group">
            <fw-input v-model.number="g" class="w-16 text-center" />
            <input v-model.number="g" type="range" min="0" max="255" step="any" class="ml-4">
          </div>

          <label>Blue</label>
          <div class="flex group">
            <fw-input v-model.number="b" class="w-16 text-center" />
            <input v-model.number="b" type="range" min="0" max="255" step="any" class="ml-4">
          </div>
        </div>
        <div>
          <label>Cyan</label>
          <div class="flex group">
            <fw-input v-model.number="c" class="w-16 text-center" />
            <input v-model.number="c" type="range" min="0" max="1" step="any" class="ml-4">
          </div>

          <label>Magenta</label>
          <div class="flex group">
            <fw-input v-model.number="m" class="w-16 text-center" />
            <input v-model.number="m" type="range" min="0" max="1" step="any" class="ml-4">
          </div>

          <label>Yellow</label>
          <div class="flex group">
            <fw-input v-model.number="y" class="w-16 text-center" />
            <input v-model.number="y" type="range" min="0" max="1" step="any" class="ml-4">
          </div>

          <label>Key (Black)</label>
          <div class="flex group">
            <fw-input v-model.number="k" class="w-16 text-center" />
            <input v-model.number="k" type="range" min="0" max="1" step="any" class="ml-4">
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
label {
  text-transform: uppercase;
  font-size: 0.6em;
  color: var(--fw-gray-700);
}

input[type=range] {
  width: 100%;
  margin-right: 1em;
}

.group {
  .input:focus-within {
    width: calc(100% - 1em) !important;

    + input[type=range] {
      display: none;
    }
  }
}

.preview {
  border-radius: var(--fw-border-radius);
}
</style>
