import useWebpageState from '@/core/components/webpage/hooks/useWebpageState'
import { useMemoizedFn } from '@/hooks'
import { IParsedWebpage } from '~/typings'
import { useLayoutEffect } from 'react'

const useWebpageContent = (options: {
  onParsed?: (s: IParsedWebpage) => void
  onStartLoad?: VoidFunction
  onEndLoad?: VoidFunction
  onFailLoad?: VoidFunction
  onGetHTML?: () => Promise<string | undefined>
  enabled?: boolean
}) => {
  const [{ noteId, url, showOriginal, content }, setWebpageState] = useWebpageState()
  const memoedLoadUrl = useMemoizedFn(async (html?: string, force?: boolean) => {
    if (!options.enabled && !force) return
    options.onStartLoad?.()
    setWebpageState(s => ({ ...s, loaded: false, isLoading: true, isFailed: false }))
    const getHTML = options.onGetHTML ? await options.onGetHTML() : undefined
    const outerHTML = html || getHTML
    try {
      const parsed = await Global.utils.parseWebpage(url, outerHTML)
      options.onEndLoad?.()
      setWebpageState(s => ({
        ...s,
        loaded: true,
        isLoading: false,
        failLoading: false
      }))
      options.onParsed?.(parsed)
      return
    } catch (e) {
      setWebpageState(s => ({ ...s, loaded: false, isLoading: false, isFailed: true }))
      options.onFailLoad?.()
    }
  })
  useLayoutEffect(() => {
    if (showOriginal) {
      options.onEndLoad?.()
      return
    }
    if (noteId) {
      options.onEndLoad?.()
      return
    }
    if (!content && !noteId) {
      memoedLoadUrl()
      return
    }
    setWebpageState(s => ({ ...s, loaded: true, isLoading: false, isFailed: false }))
  }, [url, content, showOriginal, noteId])
  return memoedLoadUrl
}

export default useWebpageContent
