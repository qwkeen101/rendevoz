import { MutableRefObject, Ref } from 'react'

function assignRef<T = any>(ref: React.ForwardedRef<T>, value: T | null) {
  if (typeof ref === 'function') {
    ref(value)
  } else if (typeof ref === 'object' && ref !== null && 'current' in ref) {
    // eslint-disable-next-line no-param-reassign
    ref.current = value
  }
}
function mergeRefs<T = any>(...refs: (MutableRefObject<T> | undefined)[]) {
  return (node: T | null) => {
    refs.forEach(ref => ref && assignRef(ref, node))
  }
}

export default mergeRefs
