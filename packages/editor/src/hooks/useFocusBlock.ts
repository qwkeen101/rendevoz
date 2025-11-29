import { RefObject, useEffect, useRef } from 'react'

export default (scrollElementRef: RefObject<HTMLElement>) => {
  const prevBlockRef = useRef<Element>()
  useEffect(() => {
    const c = scrollElementRef.current
    if (c) {
      const ch = (e: MouseEvent) => {
        prevBlockRef.current?.removeAttribute('data-selected')
        if (e.target instanceof HTMLElement) {
          const block = e.target.closest('[data-type="block"]')
          if (block) {
            block.setAttribute('data-selected', 'true')
            prevBlockRef.current = block
          }
        }
      }
      c.addEventListener('click', ch)
      return () => {
        c.removeEventListener('click', ch)
      }
    }
  }, [])
}
