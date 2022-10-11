export interface ToolHandler {
  category: string
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

const toolsByCategory: Record<string, string[]> = {}
for (const tool of tools.keys()) {
  const { category = 'undefined' } = tools.get(tool) ?? {}
  toolsByCategory[category] ??= []
  toolsByCategory[category].push(tool)
}

export const useTools = () => {
  const currentTool = ref<string>(tools.keys().next().value)

  watch(currentTool, (to, from) => {
    tools.get(from)?.reset()
  })

  return {
    currentTool,
    tools,
    toolsByCategory,
  }
}
