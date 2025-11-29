import { MarkerColor } from '@/consts'

export function getMarkerId(direction: 'end' | 'start', color: string) {
  if (!Object.values(MarkerColor).includes(color)) {
    Global.commonOps?.addExtraSvgArrows?.(color)
  }
  return `${direction}-arrow-${color}`
}
