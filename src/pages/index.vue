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

const mousemove = () => tools.get(currentTool.value)?.mousemove()
const mousedown = () => tools.get(currentTool.value)?.mousedown()
const mouseup = () => tools.get(currentTool.value)?.mouseup()
const mouseout = () => tools.get(currentTool.value)?.reset()
</script>

<template>
  <main>
    <aside>
      <template v-for="(toolz, category) in toolsByCategory" :key="category">
        <label>
          {{ category }}
        </label>

        <fw-button
          v-for="tool of toolz"
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
    </aside>
    <canvas
      ref="canvas"
      :style="{ cursor }"
      @mousemove="mousemove"
      @mousedown="mousedown"
      @mouseup="mouseup"
      @mouseout="mouseout"
    />
  </main>
</template>

<style scoped lang="scss">
aside {
  gap: 1ch;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  grid-auto-rows: min-content;
  padding: 1rem;
  border-right: 1px solid var(--fw-gray-400);

  > .funkwhale.button {
    min-width: 0;
    aspect-ratio: 1;
    margin: 0;
  }

  > label {
    grid-column: 1 / -1;
  }

  label {
    text-transform: uppercase;
    font-size: 0.75em;
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
