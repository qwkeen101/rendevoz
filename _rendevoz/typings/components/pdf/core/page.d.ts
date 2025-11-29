export interface PageSize {
  width: number
  height: number
  scale: number
  containerWidth: number
}

type SelectedTextEvent = {
  selectedText?: string
  e: PointerEvent
  rects?: Partial<{
    left: number
    top: number
    percentageLeft: number
    percentageTop: number
    width: number
    height: number
    percentageHeight: number
    percentageWidth: number
  }>[]
}
