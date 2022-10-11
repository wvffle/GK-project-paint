<script setup lang="ts">
import { onMounted } from 'vue'
import { mouseTarget } from '~/composables/mouse'
import { useTools } from '~/composables/tools'
import { canvas as canvasTarget, cursor } from '~/composables/canvas'

const canvas = ref()
onMounted(() => {
  canvasTarget.value = canvas.value
  mouseTarget.value = canvas.value
})

const { tools, toolsByCategory, currentTool } = useTools()
const current = computed(() => tools.get(currentTool.value))

const mousemove = () => current.value?.mousemove()
const mousedown = () => current.value?.mousedown()
const mouseup = () => {
  const tool = current.value
  if (!tool)
    return

  const target = tool.current
  tool.mouseup()

  if (target && !currentTool.value.endsWith('select')) {
    const selectTool = toolsByCategory.transform.find(tool => tool.endsWith('select'))
    if (selectTool) {
      currentTool.value = selectTool
      current.value.current = target
    }
  }
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

const resetTransform = () => {
  if (current.value?.current) {
    current.value.current.tx = 0
    current.value.current.ty = 0
    current.value.current.ts = 1
  }
}
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
        <div
          v-if="current.current.tx !== 0 || current.current.ty !== 0 || current.current.ts !== 1"
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
    </aside>
    <canvas
      ref="canvas"
      :style="{ cursor }"
      @mousemove="mousemove"
      @mousedown="mousedown"
      @mouseup="mouseup"
    />
  </main>
</template>

<style scoped lang="scss">
aside {
  display: grid;
  grid-template-rows: auto auto 1fr;
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
}
</style>
