class EventHandler<T> {
  private readonly handlerMap = new Map()

  on<K extends keyof T>(type: K, handler: (data: T[K], res?: (value: any) => void, rej?: (value: any) => void) => void) {
    this.handlerMap.set(type, handler)
  }
  handle(event, res?: (value: any) => void, rej?: (value: any) => void) {
    const handler = this.handlerMap.get(event.type)
    if (handler) {
      handler(event.data, res, rej)
    }
  }
}

export default EventHandler
