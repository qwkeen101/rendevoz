import useFeedState from '@/core/feed/hooks/useFeedState'
import { useEffect } from 'react'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'
import useFeedInstance from '@/core/feed/hooks/useFeedInstance'
import { assignProperties } from '@/utils'

const useArrowNavigation = () => {
  const [feedState, setFeedState] = useFeedState()
  const instance = useFeedInstance()
  assignProperties(instance, {
    navigateOps: {
      back: () => {
        setFeedState(s => {
          const focused = s.currentFocusedFeedItemId
          if (!focused) return s
          const idx = s.allFeedItems.findIndex(i => i === focused)
          if (idx >= 0) {
            const next = s.allFeedItems[idx - 1]
            if (next) {
              return {
                ...s,
                currentFocusedFeedItemId: next
              }
            }
          } else {
            return s
          }
          return s
        })
      },
      forward: () => {
        setFeedState(s => {
          const focused = s.currentFocusedFeedItemId
          if (!focused) return s
          const idx = s.allFeedItems.findIndex(i => i === focused)
          if (idx >= 0) {
            const next = s.allFeedItems[idx + 1]
            if (next) {
              return {
                ...s,
                currentFocusedFeedItemId: next
              }
            }
          } else {
            return s
          }
          return s
        })
      }
    }
  })
  useEffect(() => {
    const keyboardHandler = (e: KeyboardEvent) => {
      if (isHotkey(KEY.ArrowRight, e)) {
        instance.navigateOps?.forward()
      }
      if (isHotkey(KEY.ArrowLeft, e)) {
        instance.navigateOps?.back()
      }
    }
    document.addEventListener('keydown', keyboardHandler)
    return () => {
      document.removeEventListener('keydown', keyboardHandler)
    }
  })
}

export default useArrowNavigation
