import { useRef, useMemo } from 'react'
import { CreateContainerProps, createContainer } from './util'

export const useElementRef = ({ containerClassName, containerStyle, id, isOpen }: CreateContainerProps) => {
  const ref = useRef<HTMLDivElement>()

  const element = useMemo(
    () => (isOpen ? createContainer({ containerStyle, containerClassName, id }) : null),
    [containerClassName, containerStyle, id, isOpen]
  )

  ref.current = element

  return ref
}
