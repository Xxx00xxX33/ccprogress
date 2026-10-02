export type ProgressStatus = 'pending' | 'in_progress' | 'completed'

export type ProgressStep = { title: string; status: ProgressStatus }

export type ProgressSource = 'tool' | 'todo' | 'tasks'

export type ProgressPlan = {
  goal: string
  steps: ProgressStep[]
  source: ProgressSource
  updatedAt: number
}

declare module 'claude-code' {
  interface PluginState {
    'ccprogress': { plan: ProgressPlan | null; isExpanded: boolean; isWorking: boolean }
  }
}
