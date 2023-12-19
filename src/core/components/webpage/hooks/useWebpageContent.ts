import { globalStore, NoteStore, ObjectStore } from '@/api/stores'
import { useEffect } from 'react'
import useWebpageState, { IWebpageState } from '@/core/components/webpage/hooks/useWebpageState'
import { atom } from 'jotai'
import { useMemoizedFn } from '@/hooks'
import { Rendevoz } from '@/core/rendevoz'

export const UrlToWebpageMap = atom(new Map<string, number>())

document.addEventListener('DOMContentLoaded', () => {
  const webpagesAtom = ObjectStore('webpage').objectMapAtom
  ObjectStore('webpage').getAll()
  globalStore.sub(webpagesAtom, () => {
    const currentValue = globalStore.get(webpagesAtom)
    const map = new Map()
    currentValue.forEach(i => {
      map.set(i.url, i.id)
    })
    globalStore.set(UrlToWebpageMap, map)
  })
})
/**
 * 三种情况：1 为实体，有noteId， 2 没有实体，url变化时重新获取 3 没有实体，但是添加为实体
 */
const useWebpageContent = (options: {
  onParsed?: (s: IWebpageState['externalState']) => void
  onStartLoad?: VoidFunction
  onEndLoad?: VoidFunction
  onFailLoad?: VoidFunction
}) => {
  const [webpageState, setWebpageState] = useWebpageState()
  const currentWebpage = ObjectStore('webpage').useValue(webpageState.currentWebpageId)
  const memoedLoadUrl = useMemoizedFn(async () => {
    if (webpageState.externalState?.content) {
      setWebpageState(s => ({
        ...s,
        currentParsedContent: webpageState.externalState?.content,
        loaded: true,
        isLoading: false,
        failLoading: false,
        currentWebpage: webpageState.externalState
      }))
      options.onEndLoad?.()
      return
    }
    console.log(webpageState)
    if (webpageState.currentUrl) {
      const url = webpageState.currentUrl
      if (!webpageState.currentWebpageId || (webpageState.currentWebpageId && !webpageState.currentWebpageNoteId)) {
        // check if already has this webpage registered
        const map = globalStore.get(UrlToWebpageMap)
        if (map.has(url)) {
          const id = map.get(url)
          const wp = await ObjectStore('webpage').getOneById(id)
          if (wp && wp.noteId) {
            options.onEndLoad?.()
            setWebpageState(s => ({ ...s, currentWebpageId: wp.id, loaded: true, isLoading: false, failLoading: false }))
            return
          }
        }
      }
      if (webpageState.currentWebpageNoteId) {
        setWebpageState(s => ({ ...s, loaded: true, isLoading: false, failLoading: false }))
        options.onEndLoad?.()
        return
      }
      setWebpageState(s => ({ ...s, loaded: false, isLoading: true, failLoading: false }))
      options.onStartLoad?.()
      Rendevoz.Utils.Web.parseWebpage(url)
        .then(async res => {
          options.onEndLoad?.()
          if (webpageState.externalState?.content) {
            return
          }
          if (res) {
            const { content, author, domain, title, favicon } = res
            if (webpageState.currentWebpageId && !currentWebpage?.noteId) {
              const note = await NoteStore.initializeNoteWithValue(content)
              if (note) {
                await ObjectStore('webpage').updateOne({
                  id: webpageState.currentWebpageId,
                  noteId: note.id,
                  author,
                  domain,
                  name: title,
                  favicon
                })
              }
            }
            setWebpageState(s => ({
              ...s,
              currentParsedContent: content,
              loaded: true,
              isLoading: false,
              failLoading: false,
              currentWebpage: {
                author,
                domain,
                title,
                favicon,
                image: res.image
              }
            }))
            options.onParsed?.({
              title,
              author,
              favicon,
              domain,
              link: url,
              content,
              image: res.image
            })
            return
          }
        })
        .catch(e => {
          console.error(e)
          if (webpageState.externalState?.content) {
            options.onEndLoad?.()
            setWebpageState(s => ({ ...s, loaded: true, isLoading: false, failLoading: false }))
            return
          }
          setWebpageState(s => ({ ...s, loaded: false, isLoading: false, failLoading: true }))
          options.onFailLoad?.()
        })
    }
  })
  useEffect(() => {
    memoedLoadUrl()
  }, [webpageState.currentUrl])
  useEffect(() => {
    if (currentWebpage) {
      console.log(currentWebpage)
      setWebpageState(s => ({
        ...s,
        currentWebpageNoteId: currentWebpage.noteId,
        loaded: true,
        currentUrl: currentWebpage.url,
        currentWebpage: {
          favicon: currentWebpage.favicon,
          title: currentWebpage.title || 'Untitled',
          author: currentWebpage.author || 'Unknown author',
          domain: currentWebpage.domain || 'Unknown',
          image: currentWebpage.image
        }
      }))
    } else {
      setWebpageState(s => ({
        ...s,
        loaded: false,
        currentWebpageNoteId: undefined,
        currentWebpage: undefined
      }))
    }
  }, [currentWebpage])
}

export default useWebpageContent
