import useFeedState from '@/core/components/feed/hooks/useFeedState'
import { useEffect } from 'react'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'
import useFeedInstance from '@/core/components/feed/hooks/useFeedInstance'
import { assignProperties } from '@/utils'
import readItem from '@/core/components/feed/utils/service/readItem'
import { ObjectStore } from '@/api/stores'
import { FEED_CONTENT_CACHE } from '@/core/components/feed/contentCache'
import { Rendevoz } from '@/core/rendevoz'

const useArrowNavigation = () => {
  const [feedState, setFeedState] = useFeedState()
  const instance = useFeedInstance()
  const prepareContent = async (feedItemId: number) => {
    const feed = await ObjectStore('feed').getOneById(feedItemId)
    if (feed && !FEED_CONTENT_CACHE.has(feed.id)) {
      try {
        const result = await Rendevoz.Utils.Web.parseWebpage(feed.link)
        if (result) {
          FEED_CONTENT_CACHE.set(feed.id, result.content)
          if (!feed.state || (!feed.image && result.image)) {
            ObjectStore('feed').updateOne({
              id: feed.id,
              image: result.image,
              state: {
                title: result.title,
                author: result.author,
                domain: result.domain,
                image: result.image,
                favicon: result.favicon
              }
            })
          }
        }
      } catch (e) {
        console.error(e)
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
