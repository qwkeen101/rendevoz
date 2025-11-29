export class DragState {
  _init: boolean
  event: MouseEvent | TouchEvent
  pageX = 0
  pageY = 0
  clientX = 0
  clientY = 0
  dx = 0
  dy = 0

  constructor(
    event: PointerEvent,
    pos: {
      x: number
      y: number
    },
    init = false
  ) {
    this.event = event
    this._init = init
    if (event) {
      if ('pageX' in event) {
        this.pageX = event.pageX
        this.pageY = event.pageY
        this.clientX = event.clientX
        this.clientY = event.clientY
      }
      this.dx = this.pageX - pos.x
      this.dy = this.pageY - pos.y
    }
  }

  moved(): boolean {
    return Math.abs(this.dx) >= 1 || Math.abs(this.dy) >= 1
  }

  /**
   * @param refElement, the element being moved
   * @param draggingHtml, the element show in the dragging layer
   */
  startDrag(refElement?: HTMLElement, draggingHtml?: HTMLElement | string) {
    if (!this._init || !refElement) {
      throw new Error('startDrag can only be used in onDragStart callback')
    }
    createDraggingElement(this, refElement, draggingHtml)
    document.body.classList.add('dock-dragging')
  }

  setData(data?: { [key: string]: any }, scope?: any) {
    if (!this._init) {
      throw new Error('setData can only be used in onDragStart callback')
    }
    _dataScope = scope
    _data = data
  }

  static getData(field: string, scope?: any) {
    if (scope === _dataScope && _data) {
      return _data[field]
    }
    return null
  }

  acceptMessage: string
  rejected: boolean

  accept(message = '') {
    this.acceptMessage = message
    this.rejected = false
  }

  reject() {
    this.rejected = true
  }

  _onMove() {
    if (_data) {
      dragListeners.forEach(f => f(this))
      let searchElement = document.elementFromPoint(this.clientX, this.clientY) as HTMLElement
      let droppingHandlers: DragHandlers
      while (searchElement && searchElement !== document.body) {
        if (_dragListeners.has(searchElement)) {
          const handlers = _dragListeners.get(searchElement)
          if (handlers.onDragOverT) {
            handlers.onDragOverT(this)
            if (this.acceptMessage != null) {
              droppingHandlers = handlers
              break
            }
          }
        }
        searchElement = searchElement.parentElement
      }
      setDroppingHandler(droppingHandlers, this)
    }
  }

  _onDragEnd(canceled = false) {
    if (_droppingHandlers && _droppingHandlers.onDropT && !canceled) {
      _droppingHandlers.onDropT(this)
    }

    destroyDraggingElement(this)
    document.body.classList.remove('dock-dragging')
  }
}

export type DragHandler = (state: DragState) => void

let _dataScope: any
let _data: { [key: string]: any }

let _draggingState: DragState
// applying dragging style
let _refElement: HTMLElement
let _droppingHandlers: DragHandlers

function setDroppingHandler(handlers: DragHandlers, state: DragState) {
  if (_droppingHandlers === handlers) {
    return
  }
  if (_droppingHandlers && _droppingHandlers.onDragLeaveT) {
    _droppingHandlers.onDragLeaveT(state)
  }
  _droppingHandlers = handlers
}

interface DragHandlers {
  onDragOverT?: DragHandler
  onDragLeaveT?: DragHandler
  onDropT?: DragHandler
}

const _dragListeners: WeakMap<HTMLElement, DragHandlers> = new WeakMap<HTMLElement, DragHandlers>()

const dragListeners = new Set<(s: DragState) => void>()

export function isDragging() {
  return _draggingState != null
}

export function addDockDragHandler(cb: (s: DragState) => void) {
  dragListeners.add(cb)
}
export function removeDockDragHandler(cb: (s: DragState) => void) {
  dragListeners.delete(cb)
}
export function addHandlers(element: HTMLElement, handlers: DragHandlers) {
  _dragListeners.set(element, handlers)
}

export function removeHandlers(element: HTMLElement) {
  const handlers = _dragListeners.get(element)
  if (handlers === _droppingHandlers) {
    _droppingHandlers = null
  }
  _dragListeners.delete(element)
}

let _draggingDiv: HTMLDivElement
function createDraggingElement(state: DragState, refElement: HTMLElement, draggingHtml?: HTMLElement | string) {
  _draggingState = state
  for (const callback of _dragStateListener) {
    if (_dataScope) {
      callback(_dataScope)
    } else {
      callback(true)
    }
  }
}

export function destroyDraggingElement(e: DragState) {
  if (_refElement) {
    _refElement.classList.remove('dragging')
    _refElement = null
  }
  if (_draggingDiv) {
    _draggingDiv.remove()
    _draggingDiv = null
  }

  _draggingState = null
  setDroppingHandler(null, e)

  _dataScope = null
  _data = null

  for (const callback of _dragStateListener) {
    callback(null)
  }
}

const _dragStateListener: Set<(scope: any) => void> = new Set()

export function addDragStateListener(callback: (scope: any) => void) {
  _dragStateListener.add(callback)
}

export function removeDragStateListener(callback: (scope: any) => void) {
  _dragStateListener.delete(callback)
}
