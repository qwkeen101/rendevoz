export interface GraphNode {
  id: number
  label?: string
  type?: string
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
