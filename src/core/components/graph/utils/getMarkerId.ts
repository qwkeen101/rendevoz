import { MarkerColor } from '@/consts'
import { GlobalInstance } from '@/hooks'

export function getMarkerId(direction: 'end' | 'start', color: string) {
  if (!Object.values(MarkerColor).includes(color)) {
    GlobalInstance.commonOps?.addExtraSvgArrows(color)
  }
  return `${direction}-arrow-${color}`
}
