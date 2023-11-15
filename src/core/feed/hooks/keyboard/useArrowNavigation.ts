import useFeedState from '@/core/feed/hooks/useFeedState'
import { useEffect } from 'react'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'
import useFeedInstance from '@/core/feed/hooks/useFeedInstance'
import { assignProperties } from '@/utils'
import readItem from '@/core/feed/utils/service/readItem'
import { ObjectStore } from '@/api/stores'
import fetchUrlAndParseNote from '@/core/webpage/utils/fetchUrlAndParseNote'

const useArrowNavigation = () => {
  const [feedState, setFeedState] = useFeedState()
  const instance = useFeedInstance()
  const prepareContent = async (feedItemId: number) => {
    const feed = await ObjectStore('feed').getOneById(feedItemId)
    if (feed && !feed.state?.content) {
      const result = await fetchUrlAndParseNote(feed.link)
      if (result) {
        console.log(result)
        ObjectStore('feed').updateOne({
          id: feed.id,
          image: result.image,
          state: {
            title: result.title,
            author: result.author,
            domain: result.domain,
            image: result.image,
            favicon: result.favicon,
            content: result.noteValue
          }
        })
      }
    }
  }
  assignProperties(instance, {
    navigateOps: {
      back: () => {
        setFeedState(s => {
          const focused = s.currentFocusedFeedItemId
          if (!focused) return s
          const allItems = s.filteredFeedItems || s.allFeedItems
          const idx = allItems.findIndex(i => i === focused)
          if (idx >= 0) {
            const next = allItems[idx - 1]
            if (next) {
              readItem(next)
              const nextNext = allItems[idx - 2]
              if (nextNext) {
                prepareContent(nextNext)
              }
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
          const allItems = s.filteredFeedItems || s.allFeedItems
          const idx = allItems.findIndex(i => i === focused)
          if (idx >= 0) {
            const next = allItems[idx + 1]
            if (next) {
              const nextNext = allItems[idx + 2]
              if (nextNext) {
                prepareContent(nextNext)
              }
              readItem(next)
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
      prepareContent
    }
  })
  useEffect(() => {
    const keyboardHandler = (e: KeyboardEvent) => {
      if (isHotkey(KEY.ArrowRight, e)) {
        e.preventDefault()
        instance.navigateOps?.forward()
      }
      if (isHotkey(KEY.ArrowLeft, e)) {
        e.preventDefault()
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
