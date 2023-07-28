import { useMemo } from 'react'
import { EditorEventMap, GlobalEventMap, PdfEventMap, WhiteboardEventMap } from '~/typings'

class EventHandler<T> {
  private readonly handlerMap = new Map()

  on<K extends keyof T>(type: K, handler: (data: T[K], res?: typeof Promise.resolve, rej?: typeof Promise.reject) => void) {
    this.handlerMap.set(type, handler)
  }
  handle(event, res?: (value: any) => void, rej?: (value: any) => void) {
    const handler = this.handlerMap.get(event.type)
    if (handler) {
      handler(event.data, res, rej)
    }
  }
}

type TypeToEventMap = {
  editor: EditorEventMap
  global: GlobalEventMap
  pdf: PdfEventMap
  whiteboard: WhiteboardEventMap
}
export const useEventHandler = <T extends keyof TypeToEventMap>(type: T): EventHandler<TypeToEventMap[T]> => {
  const eventHandler = useMemo(() => {
    switch (type) {
      case 'editor':
        return new EventHandler<EditorEventMap>()
      case 'global':
        return new EventHandler<GlobalEventMap>()
      case 'pdf':
        return new EventHandler<PdfEventMap>()
      case 'whiteboard':
        return new EventHandler<WhiteboardEventMap>()
      default:
        return new EventHandler<any>()
    }
  }, [])
  return eventHandler
}

export default EventHandler
