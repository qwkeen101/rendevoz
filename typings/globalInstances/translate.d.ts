export interface IGlobalTranslateInstance {
  open: (options: {
    query: string
    from?: string
    to: string
    pos?: XYPosition
    source?: TranslateSource
    e?: PointerEvent | MouseEvent
  }) => void
  translate: (options: { query: string; from?: string; to: string; source?: TranslateSource }) => Promise<void>
  close: VoidFunction
}
