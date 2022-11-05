import { useCallback, useContext, useEffect, useRef } from 'react'
import { UNSAFE_NavigationContext as NavigationContext } from 'react-router-dom'

export function useConfirmExit(canExit: boolean, onExit?: () => void, when = true) {
  const { navigator } = useContext(NavigationContext)
  const pushRef = useRef()
  useEffect(() => {
    if (!when) {
      return
    }
    if (canExit && pushRef.current) {
      const { push, args } = pushRef.current
      push(...args)
    }
    const push = navigator.push

    navigator.push = (...args: Parameters<typeof push>) => {
      onExit?.()
      pushRef.current = {
        push,
        args
      }
    }

    return () => {
      navigator.push = push
    }
  }, [navigator, canExit, when])
}

export function usePrompt(message: string, when = true) {
  useEffect(() => {
    if (when) {
      window.onbeforeunload = function () {
        return message
      }
    }

    return () => {
      window.onbeforeunload = null
    }
  }, [message, when])

  const confirmExit = useCallback(() => {
    const confirm = window.confirm(message)
    return confirm
  }, [message])
  useConfirmExit(confirmExit, when)
}
