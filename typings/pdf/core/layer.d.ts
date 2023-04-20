import { TextContentBound, TextItem } from './text'

export type ITextLayerInstance = {
  paint: (coordinate: { x: any; y: any; width: any; height: any; offset: any }, color: string) => void
  paintBounds: (bounds: TextContentBound[], color?: string) => void
  paintItems: (items: TextItem[], color?: string) => void
}
