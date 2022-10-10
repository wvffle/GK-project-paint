<script setup lang="ts">
import { onMounted } from 'vue'
import { mouseTarget } from '~/composables/mouse'
import { useTools } from '~/composables/tools'
import { svg as svgTarget } from '~/composables/svg'

const svg = ref()
onMounted(() => {
  svgTarget.value = svg.value
  mouseTarget.value = svg.value
})

const { tools, currentTool } = useTools()

const mousemove = () => tools.get(currentTool.value)?.mousemove()
const mousedown = () => tools.get(currentTool.value)?.mousedown()
const mouseup = () => tools.get(currentTool.value)?.mouseup()
</script>

<template>
  <main>
    <aside>
      <fw-button
        v-for="tool of tools.keys()"
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
    </aside>
    <svg
      ref="svg"
      @mousemove="mousemove"
      @mousedown="mousedown"
      @mouseup="mouseup"
    />
  </main>
</template>

<style scoped lang="scss">
aside {
  gap: 1ch;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  padding: 1rem;
  border-right: 1px solid var(--fw-gray-400);

  > .funkwhale.button {
    min-width: 0;
    aspect-ratio: 1;
    margin: 0;
  }
}

main {
  display: grid;
  grid-template-columns: 300px 1fr;
  height: 100vh;

  > svg {
    width: 100%;
    height: 100%;
    stroke: currentColor;
    stroke-width: 3px;
    fill: none;

    > rect,
    > line {
      cursor: grab;
    }
  }
}
</style>
