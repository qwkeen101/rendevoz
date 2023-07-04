export interface IAnnotation {
  parentId: any
  annotationFlags: number
  annotationType: AnnotationType
  rect: number[]
  rotation: number
  subtype: string
  pageIndex: number
  dest?: [{ num: number }]
}
