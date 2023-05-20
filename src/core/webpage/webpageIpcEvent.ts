export type IpcWebpageEvent =
  | {
      eventType: 'click'
    }
  | {
      eventType: 'contextmenu'
      x: number
      y: number
    }
  | {
      eventType: 'dragstart'
      data: string[][]
    }
  | {
      eventType: 'drop'
    }
