<script setup lang="ts">
import { onMounted } from 'vue'
import { onKeyDown } from '@vueuse/core'
import { mouseTarget, x, y } from '~/composables/mouse'
import { pivot, useTools } from '~/composables/tools'
import { canvas as canvasTarget, cursor, download, exportJPEG, importJPEG, importPPM, pan, panning, pick, rgb, scale, upload } from '~/composables/canvas'

const canvas = ref()
onMounted(() => {
  canvasTarget.value = canvas.value
  mouseTarget.value = canvas.value
})

const { tools, toolsByCategory, currentTool } = useTools()
const current = computed(() => tools.get(currentTool.value))

const mousedown = () => current.value?.mousedown()
const mousemove = () => {
  pan()
  pick()
  current.value?.mousemove()
}
const mouseup = () => {
  panning.value = false

  const tool = current.value
  if (!tool)
    return

  const target = tool.current
  const close = tool.mouseup()

  if (target && !currentTool.value.endsWith('select') && (!currentTool.value.endsWith('ngon') || close)) {
    const selectTool = toolsByCategory.transform.find(tool => tool.endsWith('select'))
    if (selectTool) {
      currentTool.value = selectTool
      current.value.current = target
    }
  }
}

let steps = 0
const zoom = (event: WheelEvent) => {
  steps += event.deltaY < 0 ? 1 : -1
  scale.value = 1.5 ** steps
  requestAnimationFrame(pick)
}

const tx = computed({
  get: () => `${current.value?.current?.tx}`,
  set: (v: string) => {
    if (current.value?.current)
      current.value.current.tx = +v
  },
})

const ty = computed({
  get: () => `${current.value?.current?.ty}`,
  set: (v: string) => {
    if (current.value?.current)
      current.value.current.ty = +v
  },
})

const ts = computed({
  get: () => `${current.value?.current?.ts}`,
  set: (v: string) => {
    if (current.value?.current)
      current.value.current.ts = +v
  },
})

const tr = computed({
  get: () => current.value?.current?.tr !== undefined
    ? `${current.value?.current?.tr}`
    : undefined,
  set: (v: string) => {
    if (current.value?.current)
      current.value.current.tr = +v
  },
})

const resetTransform = () => {
  if (current.value?.current) {
    current.value.current.tx = 0
    current.value.current.ty = 0
    current.value.current.ts = 1

    if (current.value.current.tr !== undefined)
      current.value.current.tr = 1
  }
}

const importContextOpen = ref(false)
const importContext = [
  {
    type: 'button',
    text: 'Import PPM',
    icon: 'bi-image',
    click: () => {
      importPPM()
      importContextOpen.value = false
    },
  },
  {
    type: 'button',
    text: 'Import JPEG',
    icon: 'bi-image',
    click: () => {
      importJPEG()
      importContextOpen.value = false
    },
  },
]

const downloadContextOpen = ref(false)
const downloadContext = [
  {
    type: 'button',
    text: 'Save',
    icon: 'bi-save',
    click: () => {
      download()
      downloadContextOpen.value = false
    },
  },
  {
    type: 'button',
    text: 'Export to JPEG',
    icon: 'bi-image',
    click: () => {
      exportJPEG()
      downloadContextOpen.value = false
    },
  },
]

onKeyDown('p', () => {
  pivot[0] = x.value
  pivot[1] = y.value
  console.log('Update pivot:', pivot)
})
</script>

<template>
  <main>
    <aside>
      <div class="tools">
        <template v-for="(categorizedTools, category) in toolsByCategory" :key="category">
          <label>
            {{ category }}
          </label>

          <fw-button
            v-for="tool of categorizedTools"
            :key="tool"
            :is-active="currentTool === tool"
            secondary
            @click="currentTool = tool"
          >
            <template v-if="tools.get(tool)?.icon">
              <Component :is="tools.get(tool)?.icon" />
            </template>
            <template v-else>
              {{ tool[0].toUpperCase() }}
            </template>
          </fw-button>
        </template>
      </div>
      <hr v-if="currentTool === '4-select' && current?.current">
      <div
        v-if="currentTool === '4-select' && current?.current"
        class="fields"
      >
        <div
          v-for="(type, field) of current.current.fields"
          :key="field"
          class="field"
        >
          <label>
            {{ field }}
          </label>
          <fw-input
            v-if="type === 'string'"
            v-model="current.current[field]"
            icon="bi-fonts"
          />
          <fw-input
            v-else-if="type === 'number'"
            v-model.number="current.current[field]"
            icon="bi-123"
          />
          <template v-if="type === 'points'">
            <div v-for="point in current.current[field]" class="flex gap-2 mb-2">
              <fw-input
                v-model.number="point[0]"
                icon="bi-arrow-left-right"
              />
              <fw-input
                v-model.number="point[1]"
                icon="bi-arrow-down-up"
              />
            </div>
          </template>
          <fw-toggle
            v-else-if="type === 'boolean'"
            v-model="current.current[field]"
            icon="bi-123"
          />
        </div>
        <hr>
        <div class="field">
          <label>transform x</label>
          <fw-input
            v-model="tx"
            icon="bi-arrow-left-right"
          />
        </div>
        <div class="field">
          <label>transform y</label>
          <fw-input
            v-model="ty"
            icon="bi-arrow-down-up"
          />
        </div>
        <div class="field">
          <label>scale</label>
          <fw-input
            v-model="ts"
            icon="bi-arrows-angle-expand"
          />
        </div>
        <div v-if="tr !== undefined" class="field">
          <label>scale</label>
          <fw-input
            v-model="tr"
            icon="bi-arrow-clockwise"
          />
        </div>
        <div
          v-if="current.current.tx !== 0 || current.current.ty !== 0 || current.current.ts !== 1 || (current.current.tr !== 0 && current.current.tr !== undefined)"
          class="buttons"
        >
          <fw-button @click="current?.current?.applyTransform()">
            Apply tranform
          </fw-button>
          <fw-button
            icon="bi-trash"
            destructive
            @click="resetTransform"
          />
        </div>
      </div>
      <template v-else>
        <div />
        <div />
      </template>
      <hr>
      <div class="buttons">
        <div style="position: relative">
          <fw-button icon="bi-image" secondary @click="importContextOpen = true" />
          <fw-popover
            v-model:open="importContextOpen"
            :items="importContext"
          />
        </div>
        <fw-button icon="bi-upload" secondary @click="upload" />
        <div style="position: relative">
          <fw-button icon="bi-save" @click="downloadContextOpen = true" />
          <fw-popover
            v-model:open="downloadContextOpen"
            :items="downloadContext"
          />
        </div>
      </div>
    </aside>
    <canvas
      ref="canvas"
      :style="{ cursor }"
      @mousemove="mousemove"
      @mousedown.exact="mousedown"
      @mouseup="mouseup"
      @mousedown.ctrl="panning = true"
      @wheel="zoom"
    />
    <div class="rgb">
      <div class="preview" :style="{ backgroundColor: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` }" />
      <pre>r: {{ rgb.r }}<br>g: {{ rgb.g }}<br>b: {{ rgb.b }}</pre>
    </div>
  </main>
</template>

<style scoped lang="scss">
aside {
  display: grid;
  grid-template-rows: auto auto 1fr auto auto;
  border-right: 1px solid var(--fw-gray-400);

  .tools {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    grid-auto-rows: min-content;
    gap: 1ch;
    padding: 1rem;
    > .funkwhale.button {
      min-width: 0;
      aspect-ratio: 1;
      margin: 0;
    }

    > label {
      grid-column: 1 / -1;
    }
  }

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
