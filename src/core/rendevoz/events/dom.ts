import { MouseEvent } from 'react'

type DOMPointerEvent =
  | MouseEvent
  | PointerEvent
  | TouchEvent
  | MouseEvent<Element, MouseEvent>
  | MouseEvent<Element, PointerEvent>
  | MouseEvent<Element, TouchEvent>

const hasButton = (e: DOMPointerEvent) => {
  return e.target instanceof Element && e.target.closest("[role='button']")
}

const DOM = {
  hasButton
}

export default DOM
