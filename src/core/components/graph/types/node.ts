import { MetaObject } from '~/typings/data'

export interface GraphNode {
  id: number
  label?: string
  type?: MetaObject['type']
  index?: number
  x?: number
  y?: number
  // for 3d
  z?: number
  scale?: number
  opacity?: number
  hidden?: boolean
  coverImgSrc?: string
  isCenter?: boolean
  icon?: string
  objectId?: number
  color?: string
}
