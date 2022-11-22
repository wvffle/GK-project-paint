<script setup lang="ts">
import { onMounted } from 'vue'
import { mouseTarget, x, y } from '~/composables/mouse'

const SEGMENTS = 100

interface Point {
  x: number
  y: number
  root?: boolean
}

const canvas = ref()
const points = reactive<Point[]>([])
// eslint-disable-next-line no-alert
const pointCount = parseInt(prompt('Stopien') ?? '3')

const moving = ref<Point>()

const mousedown = () => {
  const mx = x.value
  const my = y.value
  for (const p of points) {
    if (p.root)
      continue

    if (mx >= p.x - 5 && mx <= p.x + 5 && my >= p.y - 5 && my <= p.y + 5) {
      moving.value = p
      break
    }
  }
}

const mouseup = () => {
  moving.value = undefined
}

const mousemove = () => {
  if (!moving.value)
    return

  moving.value.x = x.value
  moving.value.y = y.value
}

onMounted(() => {
  mouseTarget.value = canvas.value
})

useResizeObserver(canvas, ([{ contentRect }]) => {
  const { height, width } = contentRect
  canvas.value.height = height
  canvas.value.width = width

  if (points.length < pointCount) {
    points.push({
      x: 100,
      y: canvas.value.height / 2,
      root: true,
    })

    for (let i = 0; i < pointCount; ++i) {
      points.push({
        x: (canvas.value.width - 200) / (pointCount + 1) * (i + 1) + 100,
        y: canvas.value.height / 2,
      })
    }

    points.push({
      x: canvas.value.width - 100,
      y: canvas.value.height / 2,
      root: true,
    })
  }

  for (let p = 0; p < points.length; ++p) {
    if (p === 0 || p === points.length - 1)
      points[p].y = height / 2

    if (p === points.length - 1)
      points[p].x = width - 100
  }
})

const binom = (n: number, k: number) => {
  let coeff = 1
  for (let i = n - k + 1; i <= n; i++) coeff *= i
  for (let i = 1; i <= k; i++) coeff /= i
  return coeff
}

const bezier = (t: number): Point => {
  const order = points.length - 1

  let y = 0
  let x = 0

  for (let i = 0; i <= order; i++) {
    const p = points[i]
    x = x + (binom(order, i) * (1 - t) ** (order - i) * t ** i * (p.x))
    y = y + (binom(order, i) * (1 - t) ** (order - i) * t ** i * (p.y))
  }

  return { x, y }
}

watchEffect(() => {
  if (!canvas.value || points.length === 0)
    return

  const ctx = canvas.value.getContext('2d')
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
  const accuracy = 1 / SEGMENTS

  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)

  for (let i = 0; i < 1; i += accuracy) {
    const p = bezier(i)
    ctx.lineTo(p.x, p.y)
  }

  ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y)

  ctx.stroke()

  for (const p of points) {
    if (!p.root)
      ctx.fillStyle = '#0af'

    if (p === moving.value)
      ctx.fillStyle = '#fa0'

    ctx.fillRect(p.x - 5, p.y - 5, 10, 10)

    if (!p.root)
      ctx.fillStyle = '#000'
  }

  console.log('drawn')
})
</script>

<template>
  <main>
    <aside>
      <div
        v-for="field of pointCount"
        :key="field"
        class="field"
      >
        <template v-if="points[field]">
          <label>
            Point #{{ field }}
          </label>

          <div class="mb-2">
            <fw-input
              v-model.number="points[field].x"
              icon="bi-arrow-left-right"
            />
          </div>
          <fw-input
            v-model.number="points[field].y"
            icon="bi-arrow-down-up"
          />
        </template>
      </div>
    </aside>
    <canvas
      ref="canvas"
      @mousedown="mousedown"
      @mousemove="mousemove"
      @mouseup="mouseup"
    />
  </main>
</template>

<style scoped lang="scss">
aside {
  padding: 1rem;
  border-right: 1px solid var(--fw-gray-400);
  .fields {
    padding: 1rem;

    > .field {
      > label {
        &:not(:first-child) {
          padding-top: 1rem;
        }
      }
    }

    > hr {
      margin-top: 1rem;
    }

    > .buttons {
      display: flex;
      margin-top: 1rem;

      > .funkwhale.button:first-child {
        width: 100%;
      }
    }

  }

  > .buttons {
    padding: 0.5rem 1rem 1rem;
    display: flex;

    .funkwhale.popover {
      bottom: 0;
    }
  }

  label {
    text-transform: uppercase;
    font-size: 0.6em;
    color: var(--fw-gray-700);
  }
}

main {
  display: grid;
  grid-template-columns: 300px 1fr;
  height: 100vh;

  > canvas {
    width: 100%;
    height: 100%;
  }

  > .rgb {
    position: absolute;
    right: 10px;
    bottom: 10px;
    font-size: 10px;
    line-height: 1em;
    padding: 0.5em 1em 0.5em 0.5em;
    display: flex;
    pointer-events: none;
    border-radius: var(--fw-border-radius);
    background: var(--fw-bg-color);

    > .preview {
      height: 30px;
      width: 30px;
      border-radius: var(--fw-border-radius);
      margin-right: 1em;
    }
  }
}
</style>
