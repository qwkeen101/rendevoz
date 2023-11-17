import { getDistanceBetweenPointAndElement } from '@/utils'
import { isFullyScrolled, isScrollable } from './utils/scroll'

class ScrollManager {
  private scrollElement: HTMLElement | null = null
  private scrollDirection: string | null = null
  private scrollFramerId: number | null = null
  private easeing = bezier(0, 0, 1, 0.5)
  private scrollRatio = 1

  registerScrollElement(scrollElement: HTMLElement) {
    this.scrollElement = scrollElement
  }
  startScroll = (e: MouseEvent) => {
    if (!this.scrollElement) return
    const distance = getDistanceBetweenPointAndElement(e, this.scrollElement)
    const scrollableSpace = Math.max(this.scrollElement.clientHeight * 0.1, 100)
    if (distance.top < scrollableSpace && distance.top > 0 && isFullyScrolled(this.scrollElement) !== 'top') {
      this.scrollDirection = 'top'
      this.scrollRatio = this.easeing((scrollableSpace - distance.top) / scrollableSpace)
    }
    if (distance.bottom < scrollableSpace && distance.bottom > 0 && isFullyScrolled(this.scrollElement) !== 'bottom') {
      this.scrollDirection = 'bottom'
      this.scrollRatio = this.easeing((scrollableSpace - distance.bottom) / scrollableSpace)
    }
    this.scroll()
  }
  private scroll = () => {
    if (this.scrollDirection !== null && this.scrollElement) {
      const scrollSpeed = (this.scrollElement.scrollHeight * this.scrollRatio) / 100
      const direction = this.scrollDirection
      if (direction === 'top') {
        if (isFullyScrolled(this.scrollElement) === 'top') {
          this.endScroll()
          return
        }
        this.scrollElement.scrollTop -= scrollSpeed
      } else {
        if (isFullyScrolled(this.scrollElement) === 'bottom') {
          this.endScroll()
          return
        }
        this.scrollElement.scrollTop += scrollSpeed
      }
      this.scrollFramerId && cancelAnimationFrame(this.scrollFramerId)
      this.scrollFramerId = requestAnimationFrame(this.scroll)
    }
  }
  endScroll = () => {
    this.scrollFramerId && cancelAnimationFrame(this.scrollFramerId)
    this.scrollFramerId = null
    this.scrollDirection = null
  }
  canScroll = () => {
    return this.scrollElement ? isScrollable(this.scrollElement) : false
  }
  isScrolling = () => {
    return this.scrollFramerId !== null
  }
}

/**
 * https://github.com/gre/bezier-easing
 * BezierEasing - use bezier curve for transition easing function
 * by Gaëtan Renaudeau 2014 - 2015 – MIT License
 */

// These values are established by empiricism with tests (tradeoff: performance VS precision)
const NEWTON_ITERATIONS = 4
const NEWTON_MIN_SLOPE = 0.001
const SUBDIVISION_PRECISION = 0.0000001
const SUBDIVISION_MAX_ITERATIONS = 10

const kSplineTableSize = 11
const kSampleStepSize = 1.0 / (kSplineTableSize - 1.0)

const float32ArraySupported = typeof Float32Array === 'function'

function A(aA1, aA2) {
  return 1.0 - 3.0 * aA2 + 3.0 * aA1
}
function B(aA1, aA2) {
  return 3.0 * aA2 - 6.0 * aA1
}
function C(aA1) {
  return 3.0 * aA1
}

// Returns x(t) given t, x1, and x2, or y(t) given t, y1, and y2.
function calcBezier(aT, aA1, aA2) {
  return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT
}

// Returns dx/dt given t, x1, and x2, or dy/dt given t, y1, and y2.
function getSlope(aT, aA1, aA2) {
  return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1)
}

function binarySubdivide(aX, aA, aB, mX1, mX2) {
  let currentX,
    currentT,
    i = 0
  do {
    currentT = aA + (aB - aA) / 2.0
    currentX = calcBezier(currentT, mX1, mX2) - aX
    if (currentX > 0.0) {
      aB = currentT
    } else {
      aA = currentT
    }
  } while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS)
  return currentT
}

function newtonRaphsonIterate(aX, aGuessT, mX1, mX2) {
  for (let i = 0; i < NEWTON_ITERATIONS; ++i) {
    const currentSlope = getSlope(aGuessT, mX1, mX2)
    if (currentSlope === 0.0) {
      return aGuessT
    }
    const currentX = calcBezier(aGuessT, mX1, mX2) - aX
    aGuessT -= currentX / currentSlope
  }
  return aGuessT
}

function LinearEasing(x) {
  return x
}

function bezier(mX1, mY1, mX2, mY2) {
  if (!(0 <= mX1 && mX1 <= 1 && 0 <= mX2 && mX2 <= 1)) {
    throw new Error('bezier x values must be in [0, 1] range')
  }

  if (mX1 === mY1 && mX2 === mY2) {
    return LinearEasing
  }

  // Precompute samples table
  const sampleValues = float32ArraySupported ? new Float32Array(kSplineTableSize) : new Array(kSplineTableSize)
  for (let i = 0; i < kSplineTableSize; ++i) {
    sampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2)
  }

  function getTForX(aX) {
    let intervalStart = 0.0
    let currentSample = 1
    const lastSample = kSplineTableSize - 1

    for (; currentSample !== lastSample && sampleValues[currentSample] <= aX; ++currentSample) {
      intervalStart += kSampleStepSize
    }
    --currentSample

    // Interpolate to provide an initial guess for t
    const dist = (aX - sampleValues[currentSample]) / (sampleValues[currentSample + 1] - sampleValues[currentSample])
    const guessForT = intervalStart + dist * kSampleStepSize

    const initialSlope = getSlope(guessForT, mX1, mX2)
    if (initialSlope >= NEWTON_MIN_SLOPE) {
      return newtonRaphsonIterate(aX, guessForT, mX1, mX2)
    } else if (initialSlope === 0.0) {
      return guessForT
    } else {
      return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize, mX1, mX2)
    }
  }

  return function BezierEasing(x) {
    // Because JavaScript number are imprecise, we should guarantee the extremes are right.
    if (x === 0 || x === 1) {
      return x
    }
    return calcBezier(getTForX(x), mY1, mY2)
  }
}
export default ScrollManager
