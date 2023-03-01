import { MetaObject } from '~/typings/data'

export interface GraphNode {
  id: number
  label?: string
  type?: MetaObject['type']
  index?: number
  x?: number
  y?: number
  scale?: number
  opacity?: number
  hidden?: boolean
  coverImgSrc?: string
  isCenter?: boolean
  objectId?: number
  tags?: string[]
}
