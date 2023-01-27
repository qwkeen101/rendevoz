import { spring } from 'react-flip-toolkit'

export const FlipCardEnter = (el: HTMLElement) => {
  spring({
    values: {
      opacity: [0.5, 1]
    },
    onUpdate: val => {
      el.style.opacity = val.opacity
    }
  })
}

export const FlipCardExit = (el: HTMLElement, idx: number, remove) => {
  el.style.pointerEvents = 'none'
  spring({
    values: {
      opacity: [0.3, 0]
    },
    onUpdate: val => {
      el.style.opacity = val.opacity
    },
    onComplete: remove
  })
}
