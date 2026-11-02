import { CustomElement } from '~/typings'
import { useMemo } from 'react'

export default (element: CustomElement) => {
  return useMemo(() => {
    let selectable = true
    if (['table', 'iframe', 'image'].includes(element.type)) {
      selectable = false
    }
    return selectable
  }, [element])
}
