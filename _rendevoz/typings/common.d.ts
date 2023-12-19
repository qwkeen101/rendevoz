export type XYPosition = {
  x: number
  y: number
}

export type LeftTopPosition = {
  left: number
  top: number
}

export type Position = XYPosition | LeftTopPosition

export type Box = {
  left: number
  top: number
  width: number
  height: number
}

export type XYBox = {
  x: number
  y: number
  width: number
  height: number
}

export type Point = {
  x: number
  y: number
}

export type Size = {
  width: number | string
  height: number | string
}

export type PartialWithId<T> = Partial<T> & { id: number }
