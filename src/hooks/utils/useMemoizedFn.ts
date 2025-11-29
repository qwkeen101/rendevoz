import { useRef } from 'react'

type noop = (this: any, ...args: any[]) => any

type PickFunction<T extends noop> = (this: ThisParameterType<T>, ...args: Parameters<T>) => ReturnType<T>

function useMemoizedFn<T extends noop>(fn: T) {
  const fnRef = useRef<T>(fn)

  fnRef.current = fn

  const memoizedFn = useRef<PickFunction<T>>(function (this, ...args) {
    return fnRef.current.apply(this, args)
  })

  return memoizedFn.current as T
}

export default useMemoizedFn
