<script setup lang="ts">
import type { MaybeRef } from '@vueuse/core'

import { hex2rgba } from '~/composables/colors/hex'

const { files, open, reset: resetFile } = useFileDialog()

const canvas = ref()

let imageData: ImageData
const data = ref<Uint8ClampedArray>()
const { undo, redo, canUndo, canRedo, reset } = useRefHistory(data)

watch(data, (data) => {
  if (data === undefined) {
    resetFile()
    reset()
  }
})

watchPostEffect(() => {
  if (!canvas.value || !files.value || files.value.length === 0)
    return

  const context: CanvasRenderingContext2D = canvas.value.getContext('2d')

  const file = files.value[0]
  const img = new Image()
  img.src = URL.createObjectURL(file)
  img.onload = () => {
    canvas.value.width = img.width
    canvas.value.height = img.height
    context.drawImage(img, 0, 0)

    imageData = context.getImageData(0, 0, img.width, img.height)

    reset()
    data.value = new Uint8ClampedArray(imageData.data)
  }
})

const colors = ['#0af', '#fa0', '#f0a', '#0fa', '#af0', '#a0f']
const color = ref(colors[0])

const transform = (data: MaybeRef<Uint8ClampedArray | undefined>, rgba: MaybeRef<[number, number, number, number]>, transformFn: (a: number, b: number, i: number, data: Uint8ClampedArray) => number) => {
  const value = unref(data)
  if (!value)
    return

  const color = unref(rgba)
  const newData = new Uint8ClampedArray(value)

  for (let i = 0; i < newData.length; ++i) {
    if (i % 4 !== 3)
      newData[i] = transformFn(newData[i], color[i % 4], i, newData)
  }

  return newData
}

const rgba = computed(() => hex2rgba(color.value))
const add = () => (data.value = transform(data, rgba, (a, b) => a + b))
const subtract = () => (data.value = transform(data, rgba, (a, b) => a - b))
const multiply = () => (data.value = transform(data, rgba, (a, b) => a * (b / 255)))
const divide = () => (data.value = transform(data, rgba, (a, b) => a / (b / 255)))
const monochrome = () => (data.value = transform(data, [1, 0, 0, 1], (a, b, i, arr) => i % 4 === 0
  ? a * b
  : arr[i - (i % 4)],
))

type Weights = [
  number, number, number,
  number, number, number,
  number, number, number,
]
const filter = (data: MaybeRef<Uint8ClampedArray | undefined>, weights: Weights) => {
  const value = unref(data)
  if (!value)
    return

  const { width, height } = canvas.value
  const size = Math.sqrt(weights.length)

  const src = new Uint8ClampedArray(value)
  const dst = new Uint8ClampedArray(value.length)

  // go through the destination image pixels
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // calculate the weighed sum of the source image pixels that
      // fall under the convolution matrix
      let r = 0
      let g = 0
      let b = 0
      for (let convolutionY = 0; convolutionY < size; convolutionY++) {
        for (let convolutionX = 0; convolutionX < size; convolutionX++) {
          const sourceY = y + convolutionY - Math.floor(size / 2)
          const sourceX = x + convolutionX - Math.floor(size / 2)

          if (sourceY >= 0 && sourceY < height && sourceX >= 0 && sourceX < width) {
            const offset = (sourceY * width + sourceX) * 4
            const weight = weights[convolutionY * size + convolutionX]
            r += src[offset] * weight
            g += src[offset + 1] * weight
            b += src[offset + 2] * weight
          }
        }
      }
      const offset = (y * width + x) * 4
      dst[offset] = r
      dst[offset + 1] = g
      dst[offset + 2] = b
      dst[offset + 3] = 255
    }
  }

  return dst
}

const median = () => {
  if (!data.value)
    return

  const median = (...nums: number[]) => {
    const sorted = nums.sort((a, b) => a - b)
    return nums.length / 2 % 1 === 0
      ? sorted[nums.length / 2]
      : (sorted[Math.floor(nums.length / 2)] + sorted[Math.ceil(nums.length / 2)]) / 2
  }

  const { width, height } = canvas.value
  const size = 3

  const src = new Uint8ClampedArray(data.value)
  const dst = new Uint8ClampedArray(data.value.length)

  // go through the destination image pixels
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // calculate the weighed sum of the source image pixels that
      // fall under the convolution matrix
      const offset = (y * width + x) * 4

      const rgb = [0, 0, 0]
      for (let colorOffset = 0; colorOffset < 3; ++colorOffset) {
        rgb[colorOffset] = median(
          src[offset + colorOffset - width * 4 - 4],
          src[offset + colorOffset - width * 4],
          src[offset + colorOffset - width * 4 + 4],

          src[offset + colorOffset - 4],
          src[offset + colorOffset],
          src[offset + colorOffset + 4],

          src[offset + colorOffset + width * 4 - 4],
          src[offset + colorOffset + width * 4],
          src[offset + colorOffset + width * 4 + 4],
        )
      }

      dst[offset] = rgb[0]
      dst[offset + 1] = rgb[1]
      dst[offset + 2] = rgb[2]
      dst[offset + 3] = 255
    }
  }

  data.value = dst
}

const avg = () => (data.value = filter(data, [
  1 / 9, 1 / 9, 1 / 9,
  1 / 9, 1 / 9, 1 / 9,
  1 / 9, 1 / 9, 1 / 9,
]))

const sobelX = () => (data.value = filter(data, [
  -1, -2, -1,
  0, 0, 0,
  1, 2, 1,
]))

const sobelY = () => (data.value = filter(data, [
  -1, 0, 1,
  -2, 0, 2,
  -1, 0, 1,
]))

const hipass = () => (data.value = filter(data, [
  0, -1, 0,
  -1, 5, -1,
  0, -1, 0,
]))

const gauss = () => (data.value = filter(data, [
  1 / 16, 2 / 16, 1 / 16,
  2 / 16, 4 / 16, 2 / 16,
  1 / 16, 2 / 16, 1 / 16,
]))

const brightness = ref(0.5)
const projectedBrightness = useProjection(brightness, [0, 1], [-255, 255])
const dataWithBrightness = computed(() => transform(
  data,
  Array(4).fill(projectedBrightness.value) as [number, number, number, number],
  (a, b) => a + b,
))

whenever(dataWithBrightness, (data) => {
  imageData.data.set(data)
  const context: CanvasRenderingContext2D = canvas.value.getContext('2d')
  context.putImageData(imageData, 0, 0)
})
</script>

<template>
  <div class="grid grid-cols-3 h-screen">
    <div class="relative">
      <div class="absolute inset-0 flex">
        <div v-if="files" class="m-auto">
          <canvas ref="canvas" />
        </div>
        <div v-else class="m-auto border-2 border-gray-400 text-gray-400 p-30 border-dashed rounded-xl" @click="open()">
          Upload a photo
        </div>
      </div>
    </div>
    <div class="col-span-2 border-l-1 border-gray-400 p-8">
      <div>
        <label>Color</label>
        <fw-button v-for="c in colors" :key="c" :is-active="color === c" class="!min-w-auto" secondary @click="color = c">
          <div class="h-13px w-13px rounded border border-gray-600" :style="{ backgroundColor: c }" />
        </fw-button>
      </div>

      <div class="pt-4">
        <label>Point tranforms</label>
        <fw-button icon="bi-plus-square-fill" secondary @click="add" />
        <fw-button icon="bi-dash-square-fill" secondary @click="subtract" />
        <fw-button icon="bi-x-square-fill" secondary @click="multiply" />
        <fw-button icon="bi-slash-square-fill" secondary @click="divide" />
        <fw-button icon="bi-back" secondary @click="monochrome" />
      </div>

      <div class="pt-4">
        <label>Brightness</label>
        <input v-model="brightness" type="range" min="0" max="1" step="any">
        <fw-button :class="{ 'opacity-0': brightness === 0.5 }" icon="bi-arrow-counterclockwise" secondary @click="brightness = 0.5" />
      </div>

      <div class="pt-4">
        <label>Filters</label>
        <fw-button secondary @click="avg">
          Averaging
        </fw-button>
        <fw-button secondary @click="median">
          Median
        </fw-button>
        <fw-button secondary @click="sobelX">
          Sobel X
        </fw-button>
        <fw-button secondary @click="sobelY">
          Sobel Y
        </fw-button>
        <fw-button secondary @click="hipass">
          High Pass Sharpen
        </fw-button>
        <fw-button secondary @click="gauss">
          Gaussian Blur
        </fw-button>
      </div>

      <div class="pt-4">
        <label>History</label>
        <fw-button icon="bi-arrow-counterclockwise" :disabled="!canUndo" secondary @click="undo" />
        <fw-button icon="bi-arrow-clockwise" :disabled="!canRedo" secondary @click="redo" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
label {
  text-transform: uppercase;
  font-size: 0.6em;
  color: var(--fw-gray-700);
  display: block;
}
</style>
