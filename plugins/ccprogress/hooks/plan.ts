import type { ProgressPlan, ProgressStatus, ProgressStep } from '../types'

export const STATUSES: readonly ProgressStatus[] = ['pending', 'in_progress', 'completed']

// Past this many steps a segment gets too thin to read, so the bar turns continuous.
export const MAX_SEGMENTS = 12

export type Summary = {
  done: number
  total: number
  current: ProgressStep | undefined
  // 1-based position of the step being worked on, or of the last one when all are done.
  position: number
  isComplete: boolean
}

export type Tone = 'done' | 'current' | 'pending'

export type Run = { text: string; tone: Tone }

// Accepts this plugin's steps, TodoWrite todos and task list files alike.
export function toSteps(value: unknown): ProgressStep[] {
  if (!Array.isArray(value)) return []
  return value.flatMap(item => {
    if (typeof item !== 'object' || item === null) return []
    const raw = item as Record<string, unknown>
    const title = [raw.title, raw.content, raw.subject].find(
      (v): v is string => typeof v === 'string' && v.trim() !== '',
    )
    if (title === undefined) return []
    const status = STATUSES.includes(raw.status as ProgressStatus)
      ? (raw.status as ProgressStatus)
      : 'pending'
    return [{ title: title.trim(), status }]
  })
}

export function summarize(plan: ProgressPlan): Summary {
  const { steps } = plan
  const done = steps.filter(step => step.status === 'completed').length
  const total = steps.length
  const running = steps.findIndex(step => step.status === 'in_progress')
  const at = running >= 0 ? running : steps.findIndex(step => step.status === 'pending')
  return {
    done,
    total,
    current: at >= 0 ? steps[at] : undefined,
    position: at >= 0 ? at + 1 : total,
    isComplete: total > 0 && done === total,
  }
}

export function hasSteps(plan: ProgressPlan | null): plan is ProgressPlan {
  return plan !== null && plan.steps.length > 0
}

export function filled(done: number, total: number, width: number): number {
  if (total === 0) return 0
  return Math.round((Math.min(done, total) / total) * width)
}

export function barWidth(columns: number | undefined): number {
  return Math.max(8, Math.min(24, Math.floor((columns ?? 80) / 6)))
}

function toneOf(status: ProgressStatus): Tone {
  return status === 'completed' ? 'done' : status === 'in_progress' ? 'current' : 'pending'
}

function merge(runs: Run[]): Run[] {
  return runs.reduce<Run[]>((out, run) => {
    const last = out[out.length - 1]
    if (last && last.tone === run.tone) last.text += run.text
    else out.push({ ...run })
    return out
  }, [])
}

// Terminal bar: one segment per step, or one continuous bar for long plans.
export function barRuns(steps: readonly ProgressStep[], width: number): Run[] {
  const n = steps.length
  if (n === 0) return []
  if (n <= MAX_SEGMENTS && width >= n * 3 - 1) {
    const segment = Math.max(2, Math.floor((width - (n - 1)) / n))
    return steps.flatMap((step, i) => {
      const run: Run = { text: '━'.repeat(segment), tone: toneOf(step.status) }
      return i < n - 1 ? [run, { text: ' ', tone: 'pending' as const }] : [run]
    })
  }
  const done = filled(steps.filter(s => s.status === 'completed').length, n, width)
  const running = steps.some(s => s.status === 'in_progress') ? Math.min(width - done, Math.max(1, Math.round(width / n))) : 0
  return merge([
    { text: '━'.repeat(done), tone: 'done' },
    { text: '━'.repeat(running), tone: 'current' },
    { text: '─'.repeat(width - done - running), tone: 'pending' },
  ]).filter(run => run.text !== '')
}

const CJK = /[぀-ヿ㐀-鿿가-힯]/

export function isCjk(plan: ProgressPlan | null): boolean {
  if (plan === null) return false
  return CJK.test(plan.goal) || plan.steps.some(step => CJK.test(step.title))
}
