export interface ToolHandler {
  icon?: any
  cursor?: string

  mousedown(): void
  mousemove(): void
  mouseup(): void
  reset(removeElement?: boolean): void
}

const tools = new Map<string, ToolHandler>()

for (const [path, module] of Object.entries(import.meta.glob('~/tools/*.ts', { eager: true })) as [string, { default: () => ToolHandler }][]) {
  const tool = path.slice(11, -3)
  tools.set(tool, module.default())
}

export const useTools = () => {
  const currentTool = ref<string>(tools.keys().next().value)

  watch(currentTool, (to, from) => {
    tools.get(from)?.reset()
  })

  return {
    currentTool,
    tools,
  }
}
