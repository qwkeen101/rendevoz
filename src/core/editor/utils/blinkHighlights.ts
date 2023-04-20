import { css, keyframes } from '@emotion/css'

const animationKeyframes = keyframes({
  '0%': {
    backgroundImage: `linear-gradient(0deg, rgb(247, 219, 106) 0%, rgb(247, 219, 106) 2px,rgba(247, 219, 106, 0.3) 2px, rgba(247, 219, 106, 0.3) 100%)`
  },
  '100%': {
    backgroundImage: `linear-gradient(0deg, rgb(254, 255, 134) 0%, rgb(254, 255, 134) 2px,rgba(254, 255, 134, 0.6) 2px, rgba(254, 255, 134, 0.6) 100%)`
  }
})
const blinkBg = css({
  animation: `${animationKeyframes} 1s infinite`
})

export const blinkHighlights = (containerEle: HTMLElement, highlightId: number) => {
  const highlights = containerEle.querySelectorAll(`[data-highlight='${highlightId}']`)
  highlights.forEach(i => {
    i.classList.add(blinkBg)
  })
  setTimeout(() => {
    highlights.forEach(i => {
      i.classList.remove(blinkBg)
    })
  }, 5000)
}
