export type XYPosition = {
  x: number
  y: number
}

export type Box = {
  x: number
  y: number
  width: number
  height: number
  left?: number
  top?: number
}

export type PartialWithId<T extends { id: number }> = Partial<T> & { id: number }
